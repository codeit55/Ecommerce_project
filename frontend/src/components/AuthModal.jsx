import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CloseIcon, UserIcon, StoreIcon } from './Icons';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, authMode, setAuthMode, login, register, loading } =
    useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('customer'); // 'customer' | 'seller'
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (authMode === 'login') {
      const res = await login(email, password);
      if (res.success) {
        showToast('Successfully logged in.', 'success');
        setEmail('');
        setPassword('');
      } else {
        setErrorMsg(res.error);
      }
    } else {
      const res = await register(email, password);
      if (res.success) {
        showToast('Account created successfully.', 'success');
        setEmail('');
        setPassword('');
      } else {
        setErrorMsg(res.error);
      }
    }
  };

  const handleDemoFill = (demoEmail, demoPass, type = 'customer') => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setAccountType(type);
    setErrorMsg('');
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsAuthModalOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="tab-buttons">
            <button
              className={`tab-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setErrorMsg('');
              }}
            >
              Sign In
            </button>
            <button
              className={`tab-btn ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('register');
                setErrorMsg('');
              }}
            >
              Register
            </button>
          </div>
          <button
            className="modal-close-btn"
            onClick={() => setIsAuthModalOpen(false)}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

        {/* Account Role Selector for clarity */}
        <div className="auth-role-tabs">
          <button
            type="button"
            className={`role-tab ${accountType === 'customer' ? 'active' : ''}`}
            onClick={() => {
              setAccountType('customer');
              if (email === 'seller@gmail.com') {
                setEmail('');
                setPassword('');
              }
            }}
          >
            <UserIcon />
            <span>Customer</span>
          </button>
          <button
            type="button"
            className={`role-tab ${accountType === 'seller' ? 'active' : ''}`}
            onClick={() => {
              setAccountType('seller');
              handleDemoFill('seller@gmail.com', 'seller', 'seller');
            }}
          >
            <StoreIcon />
            <span>Merchant / Seller</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-email">
              {accountType === 'seller' ? 'Seller Account Email' : 'Email Address'}
            </label>
            <input
              id="auth-email"
              type="email"
              required
              placeholder={accountType === 'seller' ? 'seller@gmail.com' : 'you@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading
              ? 'Authenticating...'
              : authMode === 'login'
              ? accountType === 'seller'
                ? 'Sign In as Seller'
                : 'Sign In as Customer'
              : 'Create Account'}
          </button>
        </form>

        <div className="auth-demo-section">
          <p className="demo-label">1-Click Quick Demo Sign In</p>
          <div className="demo-buttons">
            <button
              type="button"
              className={`btn btn-ghost btn-sm ${accountType === 'customer' ? 'demo-active' : ''}`}
              onClick={() => handleDemoFill('demouser@example.com', 'password123', 'customer')}
            >
              <UserIcon />
              <span>Customer Demo</span>
            </button>
            <button
              type="button"
              className={`btn btn-ghost btn-sm ${accountType === 'seller' ? 'demo-active' : ''}`}
              onClick={() => handleDemoFill('seller@gmail.com', 'seller', 'seller')}
            >
              <StoreIcon />
              <span>Seller Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
