import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { cartApi, productsApi } from '../api/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

const GUEST_CART_KEY = 'guest_cart';

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loadingCart, setLoadingCart] = useState(false);
  const productCache = useRef({});

  // Fetch full details of a product if not in cache
  const getProductDetails = useCallback(async (productId) => {
    if (productCache.current[productId]) {
      return productCache.current[productId];
    }
    try {
      const data = await productsApi.getProductDetail(productId);
      productCache.current[productId] = data;
      return data;
    } catch {
      return { id: productId, name: `Product #${productId}`, price: 0, stock: 10 };
    }
  }, []);

  // Hydrate a raw backend cart item (which has product: id) with full product object
  const hydrateCartItem = useCallback(
    async (item) => {
      const productId = typeof item.product === 'object' ? item.product.id : item.product;
      const productObj =
        typeof item.product === 'object' ? item.product : await getProductDetails(productId);
      return {
        id: item.id,
        productId,
        quantity: item.quantity,
        product: productObj,
      };
    },
    [getProductDetails]
  );

  // Load cart from backend or localStorage
  const fetchCart = useCallback(async () => {
    setLoadingCart(true);
    try {
      if (isAuthenticated) {
        const backendItems = await cartApi.getCart();
        const itemsArray = Array.isArray(backendItems) ? backendItems : backendItems?.value || [];
        const hydrated = await Promise.all(itemsArray.map(hydrateCartItem));
        setCartItems(hydrated);
      } else {
        const saved = localStorage.getItem(GUEST_CART_KEY);
        if (saved) {
          try {
            setCartItems(JSON.parse(saved));
          } catch {
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch cart from server', err);
      // Fallback to local
      const saved = localStorage.getItem(GUEST_CART_KEY);
      if (saved) {
        try {
          setCartItems(JSON.parse(saved));
        } catch {
          setCartItems([]);
        }
      }
    } finally {
      setLoadingCart(false);
    }
  }, [isAuthenticated, hydrateCartItem]);

  // Sync guest cart to backend upon login
  useEffect(() => {
    async function syncGuestCart() {
      if (isAuthenticated) {
        const guestData = localStorage.getItem(GUEST_CART_KEY);
        if (guestData) {
          try {
            const guestItems = JSON.parse(guestData);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
              for (const item of guestItems) {
                try {
                  await cartApi.addToCart(item.productId || item.product?.id, item.quantity);
                } catch (e) {
                  console.warn('Failed to sync guest item', e);
                }
              }
              localStorage.removeItem(GUEST_CART_KEY);
            }
          } catch {
            localStorage.removeItem(GUEST_CART_KEY);
          }
        }
        fetchCart();
      } else {
        fetchCart();
      }
    }
    syncGuestCart();
  }, [isAuthenticated, fetchCart]);

  // Save guest cart changes to localStorage
  const saveGuestCart = (items) => {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  };

  // Add item to cart
  const addToCart = async (product, quantity = 1) => {
    if (product.id) {
      productCache.current[product.id] = product;
    }

    if (isAuthenticated) {
      try {
        await cartApi.addToCart(product.id, quantity);
        await fetchCart();
        showToast(`Added ${product.name} to cart!`, 'success');
        setIsCartOpen(true);
      } catch (err) {
        showToast(err.message || 'Could not add to cart', 'error');
      }
    } else {
      // Guest cart
      setCartItems((prev) => {
        const existingIdx = prev.findIndex((item) => item.productId === product.id);
        let updated;
        if (existingIdx > -1) {
          updated = [...prev];
          const newQty = updated[existingIdx].quantity + quantity;
          if (product.stock && newQty > product.stock) {
            showToast(`Only ${product.stock} items available in stock`, 'error');
            return prev;
          }
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: newQty,
          };
        } else {
          updated = [
            ...prev,
            {
              id: `guest_${Date.now()}_${Math.random()}`,
              productId: product.id,
              quantity,
              product,
            },
          ];
        }
        saveGuestCart(updated);
        return updated;
      });
      showToast(`Added ${product.name} to cart!`, 'success');
      setIsCartOpen(true);
    }
  };

  // Update quantity
  const updateQuantity = async (cartItemId, productId, newQty) => {
    if (newQty <= 0) {
      return removeFromCart(cartItemId, productId);
    }

    if (isAuthenticated && typeof cartItemId === 'number') {
      try {
        await cartApi.updateCartItem(cartItemId, newQty);
        await fetchCart();
      } catch (err) {
        showToast(err.message || 'Failed to update quantity', 'error');
      }
    } else {
      setCartItems((prev) => {
        const updated = prev.map((item) =>
          item.id === cartItemId || item.productId === productId
            ? { ...item, quantity: newQty }
            : item
        );
        saveGuestCart(updated);
        return updated;
      });
    }
  };

  // Remove from cart
  const removeFromCart = async (cartItemId, productId) => {
    if (isAuthenticated && typeof cartItemId === 'number') {
      try {
        await cartApi.removeCartItem(cartItemId);
        await fetchCart();
        showToast('Item removed from cart', 'info');
      } catch (err) {
        showToast(err.message || 'Failed to remove item', 'error');
      }
    } else {
      setCartItems((prev) => {
        const updated = prev.filter(
          (item) => item.id !== cartItemId && item.productId !== productId
        );
        saveGuestCart(updated);
        return updated;
      });
      showToast('Item removed from cart', 'info');
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (isAuthenticated) {
      for (const item of cartItems) {
        if (typeof item.id === 'number') {
          try {
            await cartApi.removeCartItem(item.id);
          } catch {
            // continue
          }
        }
      }
      setCartItems([]);
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
      setCartItems([]);
    }
  };

  // Calculations
  const totalCount = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  const subtotal = cartItems.reduce((acc, item) => {
    const price = Number(item.product?.price) || 0;
    const qty = Number(item.quantity) || 0;
    return acc + price * qty;
  }, 0);

  const value = {
    cartItems,
    loadingCart,
    isCartOpen,
    setIsCartOpen,
    totalCount,
    subtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
