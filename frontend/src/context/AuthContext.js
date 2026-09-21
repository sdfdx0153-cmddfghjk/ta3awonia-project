'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken, setToken, clearToken, setStoredUser, clearStoredUser } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    clearToken();
    // ما كنمسّحوش username باش البيانات المحلية تبقى مربوطة بنفس الحساب
    setUser(null);
    router.push('/login');
  }, [router]);

  const login = useCallback(
    async (username, password) => {
      const data = await api.post('/api/auth/login', { username, password });
      setToken(data.token);
      setStoredUser(data.user);
      setUser(data.user);
      router.push('/dashboard');
      return data;
    },
    [router]
  );

  useEffect(() => {
    async function check() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.get('/api/auth/me');
        setStoredUser(me);
        setUser(me);
      } catch {
        clearToken();
      } finally {
        setLoading(false);
      }
    }
    check();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
