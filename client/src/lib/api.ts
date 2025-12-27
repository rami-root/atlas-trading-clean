import axios from 'axios';

// إنشاء Axios instance
export const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

const makeResponse = (config: any, data: any, status = 200) => {
  return {
    data,
    status,
    statusText: String(status),
    headers: {},
    config,
    request: {},
  };
};

const getMockUserForToken = (token: string | null) => {
  if (!token) return null;
  if (token === 'mock_admin_token') {
    return {
      id: 1,
      name: 'Admin',
      email: 'admin@gmail.com',
      role: 'admin',
      balance: 0,
      referralCode: 'ATLAS123',
    };
  }
  if (token === 'mock_user_token') {
    return {
      id: 2,
      name: 'User',
      email: 'user@example.com',
      role: 'user',
      balance: 0,
      referralCode: 'ATLAS123',
    };
  }
  return null;
};

// إضافة interceptor لإرسال token مع كل طلب
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!import.meta.env.DEV) {
      return config;
    }

    const url = String(config.url ?? '');
    if (url === '/api/auth/login') {
      config.adapter = async (cfg: any) => {
        let body: any = cfg?.data;
        if (cfg?.data && typeof cfg.data === 'string') {
          try {
            body = JSON.parse(cfg.data);
          } catch {
            body = {};
          }
        }

        const email = String(body?.email ?? '').trim();
        const password = String(body?.password ?? '');

        const normalized = email.toLowerCase();
        if ((normalized === 'admin@gmail.com' || normalized === 'admin@example.com' || normalized === 'admin') && password) {
          return makeResponse(cfg, {
            token: 'mock_admin_token',
            user: getMockUserForToken('mock_admin_token'),
          });
        }

        if (email && password) {
          return makeResponse(cfg, {
            token: 'mock_user_token',
            user: getMockUserForToken('mock_user_token'),
          });
        }

        return Promise.reject({ response: { status: 400, data: { error: 'Invalid credentials' } } });
      };
    }

    if (url === '/api/auth/register') {
      config.adapter = async (cfg: any) => {
        const body = (cfg?.data && typeof cfg.data === 'string') ? JSON.parse(cfg.data) : cfg?.data;
        const email = String(body?.email ?? '');
        const password = String(body?.password ?? '');
        const name = String(body?.name ?? 'User');

        if (!email || !password) {
          return Promise.reject({ response: { status: 400, data: { error: 'Invalid registration data' } } });
        }

        return makeResponse(cfg, {
          token: 'mock_user_token',
          user: {
            id: 2,
            name,
            email,
            role: 'user',
            balance: 0,
            referralCode: 'ATLAS123',
          },
        });
      };
    }

    if (url === '/api/auth/me') {
      config.adapter = async (cfg: any) => {
        const rawAuth = String(cfg?.headers?.Authorization ?? '');
        const bearerToken = rawAuth.startsWith('Bearer ') ? rawAuth.slice('Bearer '.length) : null;
        const user = getMockUserForToken(bearerToken);
        if (!user) {
          return Promise.reject({ response: { status: 401, data: { error: 'Unauthorized' } } });
        }
        return makeResponse(cfg, { user });
      };
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
