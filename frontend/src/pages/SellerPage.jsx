import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { productsApi, ordersApi } from '../api/api';
import { formatCurrency } from '../utils/helpers';
import { StoreIcon } from '../components/Icons';

export default function SellerPage() {
  const { user, isSeller, login, openLoginModal } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('new-product');

  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: '1',
    description: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const [sellerOrders, setSellerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchSellerOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const data = await ordersApi.getSellerOrders();
      const list = Array.isArray(data) ? data : data?.results || data?.value || [];
      setSellerOrders(list);
    } catch (err) {
      console.warn('Failed to load seller orders', err);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (isSeller && activeTab === 'seller-orders') {
      fetchSellerOrders();
    }
  }, [isSeller, activeTab, fetchSellerOrders]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    if (!productForm.name || !productForm.price || !productForm.stock) {
      showToast('Please fill all required product fields', 'error');
      return;
    }

    setIsCreating(true);
    try {
      await productsApi.createProduct({
        name: productForm.name,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock, 10),
        category: parseInt(productForm.category, 10),
        description: productForm.description,
        seller: user?.id,
      });

      showToast(`Product "${productForm.name}" created successfully.`, 'success');
      setProductForm({
        name: '',
        price: '',
        stock: '',
        category: '1',
        description: '',
      });
    } catch (err) {
      showToast(err.message || 'Failed to create product.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await ordersApi.updateSellerOrderItem(itemId, newStatus);
      showToast(`Status updated to ${newStatus}`, 'success');
      fetchSellerOrders();
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  if (!isSeller) {
    return (
      <div className="seller-hub-container">
        <div className="seller-locked-card">
          <div className="empty-icon-wrap">
            <StoreIcon className="empty-svg" />
          </div>
          <h2>Seller Hub</h2>
          <p>
            The Seller Hub is reserved for verified merchant accounts. Sign in with a merchant profile to manage stock and customer shipments.
          </p>

          <div className="seller-demo-box">
            <p>Access with the merchant test profile:</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                const res = await login('seller@gmail.com', 'seller');
                if (res.success) {
                  showToast('Signed in as Seller.', 'success');
                } else {
                  openLoginModal();
                }
              }}
            >
              Sign In as Demo Seller (seller@gmail.com)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-hub-container">
      <div className="seller-header">
        <div>
          <h1>Seller Merchant Portal</h1>
          <p>Merchant Account: <strong>{user?.email}</strong></p>
        </div>

        <div className="seller-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'new-product' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-product')}
          >
            Add Product
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'seller-orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('seller-orders')}
          >
            Orders Received ({sellerOrders.length})
          </button>
        </div>
      </div>

      {activeTab === 'new-product' && (
        <div className="seller-form-card">
          <h2 className="seller-card-title">List New Product</h2>
          <form onSubmit={handleProductSubmit} className="seller-form">
            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="prod-name">Product Name</label>
                <input
                  id="prod-name"
                  type="text"
                  required
                  placeholder="e.g. Wireless Smart Keyboard"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="prod-cat">Category</label>
                <select
                  id="prod-cat"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                >
                  <option value="1">Electronics</option>
                  <option value="2">Fashion</option>
                  <option value="3">Home & Kitchen</option>
                  <option value="4">Audio & Wearables</option>
                  <option value="5">Books & Stationery</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="prod-price">Price (₹)</label>
                <input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="2499.00"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="prod-stock">Units in Stock</label>
                <input
                  id="prod-stock"
                  type="number"
                  min="1"
                  required
                  placeholder="50"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prod-desc">Product Description</label>
              <textarea
                id="prod-desc"
                rows="4"
                placeholder="Product specifications, key benefits and materials..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg mt-2"
              disabled={isCreating}
            >
              {isCreating ? 'Publishing...' : 'Publish to Catalog'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'seller-orders' && (
        <div className="seller-orders-card">
          <h2 className="seller-card-title">Customer Order Fulfillment</h2>

          {loadingOrders ? (
            <p>Loading orders...</p>
          ) : sellerOrders.length === 0 ? (
            <div className="seller-orders-empty">
              <p>No orders received for your products yet.</p>
            </div>
          ) : (
            <div className="seller-orders-table-wrapper">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Item ID</th>
                    <th>Order #</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerOrders.map((item) => (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>#{item.order_id}</td>
                      <td><strong>{item.produc_name || item.product}</strong></td>
                      <td>{item.quantiy}</td>
                      <td>{formatCurrency(item.price_purchased_at)}</td>
                      <td>
                        <span className={`badge-status status-${(item.status || 'pending').toLowerCase()}`}>
                          {item.status || 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <select
                          className="status-select-sm"
                          value={item.status || 'PENDING'}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
