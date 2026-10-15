import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getAccessToken, clearTokens, ordersApi } from '../api/api';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem('user_email');
    const token = getAccessToken();
    const role = localStorage.getItem('user_role') || 'CUSTOMER';
    if (token && email) {
      const payload = parseJwt(token);
      return { email, role, id: payload?.user_id };
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  // Check seller status dynamically if user is authenticated
  const checkSellerRole = useCallback(async () => {
    try {
      await ordersApi.getSellerOrders();
      // If no 403 error, user is seller or admin
      setUser((prev) => {
        if (!prev) return null;
        localStorage.setItem('user_role', 'SELLER');
        return { ...prev, role: 'SELLER' };
      });
    } catch {
      // Not a seller
      setUser((prev) => {
        if (!prev) return null;
        localStorage.setItem('user_role', 'CUSTOMER');
        return { ...prev, role: 'CUSTOMER' };
      });
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      checkSellerRole();
    }
  }, [user?.email, checkSellerRole]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      const payload = parseJwt(data.access);
      const initialRole = email.toLowerCase().includes('seller') ? 'SELLER' : 'CUSTOMER';
      localStorage.setItem('user_role', initialRole);
      const newUser = {
        email,
        role: initialRole,
        id: payload?.user_id,
      };
      setUser(newUser);
      setIsAuthModalOpen(false);

      // Verify seller status
      checkSellerRole();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed. Please check credentials.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    setLoading(true);
    try {
      await authApi.register(email, password);
      // Auto login right after registration
      return await login(email, password);
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Registration failed. Email might already be taken.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authApi.logout();
    clearTokens();
    setUser(null);
  };

  const openLoginModal = () => {
    setAuthMode('login');
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthMode('register');
    setIsAuthModalOpen(true);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isSeller: user?.role === 'SELLER',
    loading,
    login,
    register,
    logout,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    openLoginModal,
    openRegisterModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
