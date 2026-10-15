const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : 'http://localhost:8000/api';

// Helper to get access token from localStorage
export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const setTokens = (access, refresh) => {
  if (access) localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_role');
};

// Helper for authorized headers
const authHeaders = () => {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Generic request wrapper with automatic JSON parsing and error handling
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  // If unauthorized, token might be expired
  if (response.status === 401 && getRefreshToken() && !options._retry) {
    options._retry = true;
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${getAccessToken()}`,
      };
      return request(endpoint, options);
    }
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (data && typeof data === 'object' && (data.detail || data.error || data.message)) ||
      (typeof data === 'string' && data.length < 200 ? data : null) ||
      `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Refresh token call
export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.access) {
        localStorage.setItem('access_token', data.access);
        return true;
      }
    }
  } catch (e) {
    console.warn('Failed to refresh token', e);
  }
  clearTokens();
  return false;
}

// Auth API
export const authApi = {
  login: async (email, password) => {
    const data = await request('/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (data.access) {
      setTokens(data.access, data.refresh);
      localStorage.setItem('user_email', email);
    }
    return data;
  },

  register: async (email, password) => {
    return request('/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  },

  logout: () => {
    clearTokens();
  },
};

// Products API
export const productsApi = {
  getProducts: async ({ search = '', category = '', minPrice = '', maxPrice = '', ordering = '' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (minPrice) params.append('min_price', minPrice);
    if (maxPrice) params.append('max_price', maxPrice);
    if (ordering) params.append('ordering', ordering);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return request(`/products/${queryString}`);
  },

  getProductDetail: async (id) => {
    return request(`/products/${id}/`);
  },

  createProduct: async (productData) => {
    return request('/products/', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(productData),
    });
  },
};

// Cart API
export const cartApi = {
  getCart: async () => {
    return request('/cart/', {
      headers: authHeaders(),
    });
  },

  addToCart: async (productId, quantity = 1) => {
    return request('/cart/items/', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ product: productId, quantity }),
    });
  },

  updateCartItem: async (itemId, quantity) => {
    return request(`/cart/items/${itemId}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ quantity }),
    });
  },

  removeCartItem: async (itemId) => {
    return request(`/cart/items/${itemId}/`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
  },
};

// Orders API
export const ordersApi = {
  checkout: async () => {
    return request('/orders/checkout/', {
      method: 'POST',
      headers: authHeaders(),
    });
  },

  getOrders: async () => {
    return request('/orders/', {
      headers: authHeaders(),
    });
  },

  getSellerOrders: async () => {
    return request('/orders/seller/', {
      headers: authHeaders(),
    });
  },

  updateSellerOrderItem: async (itemId, status) => {
    return request(`/orders/seller/${itemId}/`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
  },
};
