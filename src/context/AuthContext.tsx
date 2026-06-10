import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config';

export interface User {
  id: number;
  username: string;
  display_name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            setUser(data.user);
          } else {
            logout();
          }
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (error) {
        console.error('Failed to validate auth token:', error);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      key: 'login-auth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    } as RequestInit);

    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(
        data?.error || `連線失敗 (HTTP ${response.status})，請確認後台伺服器是否已啟動`
      );
    }

    localStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (username: string, password: string, displayName: string) => {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      key: 'register-auth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, displayName })
    } as RequestInit);

    let data: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(
        data?.error || `註冊失敗 (HTTP ${response.status})，請確認後台伺服器是否已啟動`
      );
    }

    localStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
