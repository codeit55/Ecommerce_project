import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency, getProductImage } from '../utils/helpers';
import { CloseIcon, TrashIcon, ArrowRightIcon, BagIcon } from './Icons';

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    totalCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const freeDeliveryThreshold = 1000;
  const progressToFreeDelivery = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  return (
    <div className="cart-backdrop" onClick={() => setIsCartOpen(false)}>
      <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <div className="cart-drawer-title-group">
            <h3>Shopping Cart</h3>
            <span className="cart-count-pill">{totalCount}</span>
          </div>
          <button
            className="cart-close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            <CloseIcon />
          </button>
        </div>

        {cartItems.length > 0 && (
          <div className="free-shipping-bar">
            {remainingForFreeDelivery === 0 ? (
              <p className="free-shipping-text success">Eligible for Free Standard Delivery</p>
            ) : (
              <p className="free-shipping-text">
                Add <strong>{formatCurrency(remainingForFreeDelivery)}</strong> more for Free Delivery
              </p>
            )}
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progressToFreeDelivery}%` }}
              />
            </div>
          </div>
        )}

        <div className="cart-drawer-body">
          {cartItems.length === 0 ? (
            <div className="cart-empty-state">
              <div className="cart-empty-icon-wrap">
                <BagIcon className="cart-empty-svg" />
              </div>
              <h4>Your cart is empty</h4>
              <p>Explore our catalog to find items you love.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCartOpen(false)}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <ul className="cart-items-list">
              {cartItems.map((item) => {
                const prod = item.product || {};
                const price = Number(prod.price) || 0;
                const itemTotal = price * item.quantity;
                const maxStock = prod.stock || 999;
                const imageUrl = getProductImage(prod);

                return (
                  <li key={item.id || item.productId} className="cart-item-card">
                    <img
                      src={imageUrl}
                      alt={prod.name || 'Product'}
                      className="cart-item-thumb-img"
                    />

                    <div className="cart-item-details">
                      <div className="cart-item-title-row">
                        <h4 className="cart-item-title">{prod.name || 'Product'}</h4>
                        <button
                          type="button"
                          className="cart-item-remove-btn"
                          onClick={() => removeFromCart(item.id, item.productId)}
                          title="Remove item"
                          aria-label="Remove item"
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      <div className="cart-item-price-unit">{formatCurrency(price)} each</div>

                      <div className="cart-item-footer">
                        <div className="quantity-selector quantity-selector-sm">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() =>
                              updateQuantity(item.id, item.productId, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() =>
                              updateQuantity(item.id, item.productId, item.quantity + 1)
                            }
                            disabled={item.quantity >= maxStock}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <div className="cart-item-total">{formatCurrency(itemTotal)}</div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-subtotal-row">
              <span>Subtotal</span>
              <span className="cart-subtotal-amount">{formatCurrency(subtotal)}</span>
            </div>
            <p className="cart-shipping-note">Shipping and taxes calculated during checkout</p>

            <button
              type="button"
              className="btn btn-primary btn-full btn-checkout"
              onClick={handleCheckoutClick}
            >
              <span>Proceed to Checkout</span>
              <ArrowRightIcon />
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm btn-clear-cart"
              onClick={clearCart}
            >
              Clear Cart
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
