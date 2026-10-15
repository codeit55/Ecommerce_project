import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../api/api';
import { formatCurrency, getProductImage } from '../utils/helpers';
import { PackageIcon, ArrowRightIcon } from '../components/Icons';

export default function OrdersPage() {
  const { user, isAuthenticated, openLoginModal } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    let combined = [];

    // 1. Fetch from backend if authenticated
    if (isAuthenticated) {
      try {
        const backendOrders = await ordersApi.getOrders();
        const list = Array.isArray(backendOrders)
          ? backendOrders
          : backendOrders?.results || backendOrders?.value || [];
        combined = [...list];
      } catch (e) {
        console.warn('Backend orders fallback to local cache:', e);
      }
    }

    // 2. Fetch local storage orders
    const userKey = user?.email ? `orders_${user.email}` : 'orders_guest';
    const localOrdersRaw = localStorage.getItem(userKey);
    if (localOrdersRaw) {
      try {
        const localList = JSON.parse(localOrdersRaw);
        if (Array.isArray(localList)) {
          localList.forEach((loc) => {
            if (!combined.some((o) => String(o.id) === String(loc.id))) {
              combined.push(loc);
            }
          });
        }
      } catch (err) {
        console.warn('Failed parsing local orders', err);
      }
    }

    if (isAuthenticated) {
      const guestRaw = localStorage.getItem('orders_guest');
      if (guestRaw) {
        try {
          const guestList = JSON.parse(guestRaw);
          if (Array.isArray(guestList)) {
            guestList.forEach((g) => {
              if (!combined.some((o) => String(o.id) === String(g.id))) {
                combined.push(g);
              }
            });
          }
        } catch {
          // ignore
        }
      }
    }

    // Sort by date descending
    combined.sort((a, b) => {
      const timeA = new Date(a.date || a.created_at || 0).getTime();
      const timeB = new Date(b.date || b.created_at || 0).getTime();
      return timeB - timeA;
    });

    setOrders(combined);
    setLoading(false);
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="orders-page-container">
      <div className="orders-header">
        <div>
          <h1>My Orders</h1>
          <p>Review purchase history and status updates</p>
        </div>
        {!isAuthenticated && (
          <div className="orders-guest-alert">
            <span>Guest session.</span>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={openLoginModal}
            >
              Sign In
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="orders-loading-state">
          <p>Retrieving orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty-state">
          <div className="empty-icon-wrap">
            <PackageIcon className="empty-svg" />
          </div>
          <h2>No orders placed yet</h2>
          <p>When you complete a purchase, your items and tracking details will be displayed here.</p>
          <Link to="/products" className="btn btn-primary mt-4">
            <span>Browse Products</span>
            <ArrowRightIcon />
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const dateStr = order.date || order.created_at;
            const items = order.items || [];
            const status = order.status || 'CONFIRMED';
            const total = Number(order.total_amount) || 0;

            return (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-header-info">
                    <span className="order-id-label">Order #{order.id}</span>
                    <span className="order-date">
                      {dateStr ? new Date(dateStr).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }) : 'Recent'}
                    </span>
                  </div>

                  <div className="order-header-status">
                    <span className={`badge-status status-${status.toLowerCase()}`}>
                      {status}
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items-table">
                    {items.map((item, idx) => {
                      const name = item.name || item.product_name || item.produc_name || `Item #${item.id || idx + 1}`;
                      const price = Number(item.price || item.price_purchased_at) || 0;
                      const qty = item.quantity || item.quantiy || 1;
                      const img = getProductImage(item);

                      return (
                        <div key={idx} className="order-item-row">
                          <img src={img} alt={name} className="order-item-thumb-img" />
                          <div className="order-item-info">
                            <span className="order-item-name">{name}</span>
                            <span className="order-item-qty">
                              Quantity: {qty} • {formatCurrency(price)}
                            </span>
                          </div>
                          <span className="order-item-subtotal">
                            {formatCurrency(price * qty)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="order-card-footer">
                  {order.shipping?.address && (
                    <div className="order-shipping-summary">
                      <span className="shipping-label">Shipped to:</span>
                      <span className="shipping-dest">
                        {order.shipping.fullName} • {order.shipping.city}
                      </span>
                    </div>
                  )}

                  <div className="order-total-summary">
                    <span className="total-label">Total:</span>
                    <strong className="total-amount">{formatCurrency(total)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
