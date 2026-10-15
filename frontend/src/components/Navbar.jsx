import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { SearchIcon, CartIcon, BagIcon, UserIcon, StoreIcon } from './Icons';

export default function Navbar({ storeName = 'ShopSphere' }) {
  const { user, isAuthenticated, isSeller, logout, openLoginModal } = useAuth();
  const { totalCount, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = e.target.elements.search?.value?.trim();
    if (query !== undefined) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand / Logo */}
        <Link to="/products" className="navbar-brand">
          <span className="navbar-brand-mark">
            <BagIcon className="brand-icon" />
          </span>
          <span className="navbar-brand-text">{storeName}</span>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="navbar-search-form">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            name="search"
            placeholder="Search products, brands and essentials..."
            className="navbar-search-input"
            defaultValue={
              location.pathname === '/products'
                ? new URLSearchParams(location.search).get('search') || ''
                : ''
            }
          />
        </form>

        {/* Navigation & Actions */}
        <nav className="navbar-actions">
          <Link
            to="/products"
            className={`nav-link ${location.pathname === '/products' || location.pathname === '/' ? 'active' : ''}`}
          >
            Catalog
          </Link>

          <Link
            to="/orders"
            className={`nav-link ${location.pathname === '/orders' ? 'active' : ''}`}
          >
            Orders
          </Link>

          {/* Seller Portal Link - Always Accessible */}
          <Link
            to="/seller"
            className={`nav-link seller-nav-link ${location.pathname === '/seller' ? 'active' : ''}`}
          >
            <StoreIcon className="seller-nav-icon" />
            <span>Seller Hub</span>
          </Link>

          {/* Cart Trigger */}
          <button
            type="button"
            className="navbar-cart-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label="View shopping cart"
          >
            <CartIcon className="cart-btn-icon" />
            <span className="cart-btn-label">Cart</span>
            {totalCount > 0 && <span className="cart-badge-count">{totalCount}</span>}
          </button>

          {/* User Auth Section */}
          <div className="navbar-auth-section">
            {isAuthenticated ? (
              <div className="user-profile-menu">
                <div className="user-info-chip" title={user.email}>
                  <span className="user-avatar">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                  <div className="user-meta">
                    <span className="user-email-text">{user.email.split('@')[0]}</span>
                    <span className={`user-role-tag ${user.role?.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-logout"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-sm btn-signin"
                onClick={openLoginModal}
              >
                <UserIcon className="signin-icon" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}