import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  balance: number;
  referralCode: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // تحميل بيانات المستخدم عند بدء التطبيق
  useEffect(() => {
    refreshUser();
  }, []);

  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const data = response.data;
      if (typeof data === 'string' && data.toLowerCase().includes('<!doctype html')) {
        throw new Error(
          'API غير متصل: الطلب رجع صفحة HTML. تأكد أن /api/auth/login يعمل وأن VITE_API_BASE_URL مضبوط على رابط السيرفر.'
        );
      }
      const { token, user } = data;

      localStorage.setItem('auth_token', token);
      setUser(user);
    } catch (err: any) {
      const status = err?.response?.status;
      const respData = err?.response?.data;
      const serverMsg = typeof respData?.error === 'string' ? respData.error : null;
      if (typeof respData === 'string' && respData.toLowerCase().includes('<!doctype html')) {
        throw new Error(
          'API غير متصل: الطلب رجع صفحة HTML. تأكد أن /api/auth/login يعمل وأن VITE_API_BASE_URL مضبوط على رابط السيرفر.'
        );
      }
      if (serverMsg) {
        throw new Error(serverMsg);
      }
      if (status) {
        throw new Error(`فشل تسجيل الدخول (HTTP ${status})`);
      }
      throw new Error('فشل تسجيل الدخول');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/api/auth/register', data);
      const resp = response.data;
      if (typeof resp === 'string' && resp.toLowerCase().includes('<!doctype html')) {
        throw new Error(
          'API غير متصل: الطلب رجع صفحة HTML. تأكد أن /api/auth/register يعمل وأن VITE_API_BASE_URL مضبوط على رابط السيرفر.'
        );
      }
      const { token, user } = resp;

      if (token) {
        localStorage.setItem('auth_token', token);
        setUser(user);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const respData = err?.response?.data;
      const serverMsg = typeof respData?.error === 'string' ? respData.error : null;
      if (typeof respData === 'string' && respData.toLowerCase().includes('<!doctype html')) {
        throw new Error(
          'API غير متصل: الطلب رجع صفحة HTML. تأكد أن /api/auth/register يعمل وأن VITE_API_BASE_URL مضبوط على رابط السيرفر.'
        );
      }
      if (serverMsg) {
        throw new Error(serverMsg);
      }
      if (status) {
        throw new Error(`فشل التسجيل (HTTP ${status})`);
      }
      throw new Error('فشل التسجيل');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
