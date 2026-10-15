import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';

import Products from './pages/products';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import SellerPage from './pages/SellerPage';
import { BagIcon } from './components/Icons';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <div className="app-container">
              <Navbar storeName="ShopSphere" />

              <div className="main-content">
                <Routes>
                  <Route path="/" element={<Navigate to="/products" replace />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/seller" element={<SellerPage />} />
                  <Route path="*" element={<Navigate to="/products" replace />} />
                </Routes>
              </div>

              <CartDrawer />
              <AuthModal />

              <footer className="app-footer">
                <div className="footer-inner">
                  <div className="footer-col">
                    <div className="footer-brand">
                      <BagIcon className="footer-brand-icon" />
                      <span>ShopSphere</span>
                    </div>
                    <p className="footer-tagline">
                      Curated quality electronics, apparel, and essentials designed for everyday living.
                    </p>
                  </div>

                  <div className="footer-col">
                    <h4>Catalog & Navigation</h4>
                    <ul>
                      <li><a href="/products">All Products</a></li>
                      <li><a href="/orders">Order History</a></li>
                      <li><a href="/seller">Seller Portal</a></li>
                    </ul>
                  </div>

                  <div className="footer-col">
                    <h4>Customer Support</h4>
                    <ul>
                      <li><span>Toll-free: 1800-123-7467</span></li>
                      <li><span>Email: support@shopsphere.io</span></li>
                      <li><span>Verified express delivery across India</span></li>
                    </ul>
                  </div>
                </div>

                <div className="footer-bottom">
                  <p>© {new Date().getFullYear()} ShopSphere Inc. All rights reserved.</p>
                </div>
              </footer>
            </div>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;