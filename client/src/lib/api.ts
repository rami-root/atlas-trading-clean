import axios from 'axios';

// إنشاء Axios instance
export const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE_URL
    ? String((import.meta as any).env.VITE_API_BASE_URL).trim().replace(/\/$/, '')
    : '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة interceptor لإرسال token مع كل طلب
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// إضافة interceptor للتعامل مع الأخطاء
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // إزالة token وإعادة التوجيه لصفحة تسجيل الدخول
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
