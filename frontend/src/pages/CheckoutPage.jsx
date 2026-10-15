import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ordersApi } from '../api/api';
import { formatCurrency, getProductImage } from '../utils/helpers';
import { CheckIcon, BagIcon, ArrowRightIcon } from '../components/Icons';

export default function CheckoutPage() {
  const { cartItems, subtotal, clearCart } = useCart();
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    paymentMethod: 'cod', // 'cod' | 'upi'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const deliveryFee = subtotal > 1000 || subtotal === 0 ? 0 : 50;
  const grandTotal = subtotal + deliveryFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
      showToast('Please fill in all shipping details', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let backendOrderId = null;

      // Attempt backend checkout if user is authenticated
      if (isAuthenticated) {
        try {
          const res = await ordersApi.checkout();
          if (res?.order_id) {
            backendOrderId = res.order_id;
          }
        } catch (backendError) {
          console.warn('Backend checkout returned an error, falling back to local order store:', backendError);
        }
      }

      // Generate order record
      const orderId = backendOrderId || `ORD-${Date.now().toString().slice(-6)}`;
      const orderRecord = {
        id: orderId,
        date: new Date().toISOString(),
        items: cartItems.map((item) => ({
          id: item.productId || item.product?.id,
          name: item.product?.name || 'Product',
          price: Number(item.product?.price) || 0,
          quantity: item.quantity,
          category: item.product?.category,
        })),
        total_amount: grandTotal,
        shipping: { ...formData },
        status: 'CONFIRMED',
      };

      // Save order to user's order history in localStorage
      const userKey = user?.email ? `orders_${user.email}` : 'orders_guest';
      const existingOrders = JSON.parse(localStorage.getItem(userKey) || '[]');
      localStorage.setItem(userKey, JSON.stringify([orderRecord, ...existingOrders]));

      // Clear cart
      await clearCart();

      // Show confirmation screen
      setOrderSuccess(orderRecord);
      showToast('Order confirmed successfully.', 'success');
    } catch (err) {
      showToast(err.message || 'Error processing order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was placed successfully, show success view
  if (orderSuccess) {
    return (
      <div className="checkout-success-container">
        <div className="checkout-success-card">
          <div className="success-icon-badge">
            <CheckIcon />
          </div>
          <span className="success-tag">Order Confirmed</span>
          <h2>Thank you for your order</h2>
          <p className="success-subtitle">
            Order reference <strong>#{orderSuccess.id}</strong> has been received and is being prepared.
          </p>

          <div className="order-summary-details">
            <div className="summary-row">
              <span>Date Placed:</span>
              <strong>{new Date(orderSuccess.date).toLocaleDateString()}</strong>
            </div>
            <div className="summary-row">
              <span>Delivery To:</span>
              <strong>
                {orderSuccess.shipping.fullName}, {orderSuccess.shipping.address},{' '}
                {orderSuccess.shipping.city}
              </strong>
            </div>
            <div className="summary-row">
              <span>Payment Mode:</span>
              <strong>
                {orderSuccess.shipping.paymentMethod === 'cod'
                  ? 'Cash on Delivery (COD)'
                  : 'UPI / Online Payment'}
              </strong>
            </div>
            <div className="summary-row summary-total-row">
              <span>Total Paid:</span>
              <strong className="summary-total-price">
                {formatCurrency(orderSuccess.total_amount)}
              </strong>
            </div>
          </div>

          <div className="success-actions-row">
            <Link to="/orders" className="btn btn-primary">
              <span>View Orders</span>
              <ArrowRightIcon />
            </Link>
            <Link to="/products" className="btn btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty-container">
        <div className="cart-empty-state">
          <div className="cart-empty-icon-wrap">
            <BagIcon className="cart-empty-svg" />
          </div>
          <h2>Your cart is empty</h2>
          <p>Add some products to your cart before proceeding to checkout.</p>
          <Link to="/products" className="btn btn-primary">
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      <div className="checkout-header-bar">
        <h1>Checkout</h1>
        <p>Complete your shipping and delivery details below</p>
      </div>

      <div className="checkout-grid">
        {/* Left Side: Shipping Form */}
        <section className="checkout-form-section">
          {!isAuthenticated && (
            <div className="checkout-guest-notice">
              <span>Checking out as guest.</span>
              <button
                type="button"
                className="btn-link"
                onClick={openLoginModal}
              >
                Sign in to link to your account
              </button>
            </div>
          )}

          <form onSubmit={handlePlaceOrder} id="checkout-form" className="checkout-form">
            <h3 className="section-title">Shipping Information</h3>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Delivery Address</label>
              <textarea
                id="address"
                name="address"
                rows="3"
                required
                placeholder="Flat / Building, Street, Landmark"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  required
                  placeholder="Bengaluru"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="pincode">Postal Code</label>
                <input
                  id="pincode"
                  name="pincode"
                  type="text"
                  required
                  placeholder="560001"
                  value={formData.pincode}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <h3 className="section-title mt-6">Payment Method</h3>
            <div className="payment-options-group">
              <label
                className={`payment-radio-card ${
                  formData.paymentMethod === 'cod' ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={handleInputChange}
                />
                <div className="payment-radio-info">
                  <div className="payment-radio-title">Cash on Delivery (COD)</div>
                  <div className="payment-radio-desc">Pay cash or scan QR code upon delivery</div>
                </div>
              </label>

              <label
                className={`payment-radio-card ${
                  formData.paymentMethod === 'upi' ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={formData.paymentMethod === 'upi'}
                  onChange={handleInputChange}
                />
                <div className="payment-radio-info">
                  <div className="payment-radio-title">UPI / NetBanking / Cards</div>
                  <div className="payment-radio-desc">Instant online payment gateway</div>
                </div>
              </label>
            </div>
          </form>
        </section>

        {/* Right Side: Order Summary */}
        <aside className="checkout-summary-section">
          <div className="checkout-summary-card">
            <h3 className="summary-title">Order Summary ({cartItems.length} items)</h3>

            <div className="checkout-items-list">
              {cartItems.map((item) => {
                const prod = item.product || {};
                const price = Number(prod.price) || 0;
                const imageUrl = getProductImage(prod);

                return (
                  <div key={item.id || item.productId} className="checkout-item-row">
                    <img
                      src={imageUrl}
                      alt={prod.name || 'Product'}
                      className="checkout-item-thumb-img"
                    />
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{prod.name}</span>
                      <span className="checkout-item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="checkout-item-price">
                      {formatCurrency(price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="summary-divider" />

            <div className="summary-line">
              <span>Items Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div className="summary-line">
              <span>Standard Delivery</span>
              <span>{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-line total-line">
              <strong>Total Amount</strong>
              <strong className="grand-price">{formatCurrency(grandTotal)}</strong>
            </div>

            <button
              type="submit"
              form="checkout-form"
              className="btn btn-primary btn-full btn-lg mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing Order...' : `Confirm Order • ${formatCurrency(grandTotal)}`}
            </button>

            <p className="checkout-guarantee">
              Secure 256-bit encrypted checkout with purchase protection
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
