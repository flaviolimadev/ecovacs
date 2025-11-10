import axios from 'axios';

// Base API URL - usa variável de ambiente ou fallback para localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - adiciona token em cada requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request:', config.method?.toUpperCase(), config.url, '- Token presente:', token.substring(0, 20) + '...');
    } else {
      console.warn('API Request:', config.method?.toUpperCase(), config.url, '- SEM TOKEN!');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - trata erros
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url, '- Status:', response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.method?.toUpperCase(), error.config?.url, '- Status:', error.response?.status);
    console.error('API Error Data:', error.response?.data);
    
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      console.warn('Token inválido! Limpando localStorage e redirecionando...');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // Só redirecionar se não estiver já na página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
    referral_code?: string;
  }) => api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get('/auth/me'),
};

// Profile API
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data: { name: string; email: string; phone?: string }) =>
    api.put('/profile', data),
  updatePassword: (data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }) => api.put('/profile/password', data),
  getStatement: () => api.get('/profile/statement'),
};

// Plans API
export const plansAPI = {
  getAll: () => api.get('/plans'),
};

// Investments API
export const investmentsAPI = {
  create: (planId: number) => api.post('/investments', { plan_id: planId }),
  getAll: (status?: 'active' | 'finished' | 'all') => 
    api.get('/investments', { params: { status } }),
  getById: (id: number) => api.get(`/investments/${id}`),
  getStats: () => api.get('/investments/stats'),
};

// Statement API
export const statementAPI = {
  get: (params?: { type?: string; page?: number }) =>
    api.get('/statement', { params }),
};

// Withdrawals API
export const withdrawalsAPI = {
  create: (amount: number) => api.post('/withdrawals', { amount }),
};

// Network API (Referrals/Members)
export const networkAPI = {
  getStats: () => api.get('/network/stats'),
  getTree: (level?: number) => api.get('/network/tree', { params: { level } }),
  getReferralLink: () => api.get('/network/referral-link'),
  getCommissionDetails: () => api.get('/network/commission-details'),
};

