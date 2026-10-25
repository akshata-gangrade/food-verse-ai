import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('aahaar_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('aahaar_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('aahaar_token');
      if (savedToken) {
        try {
          const res = await authService.getMe();
          setUser(res.data);
          localStorage.setItem('aahaar_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authService.login({ email, password });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('aahaar_token', access_token);
      localStorage.setItem('aahaar_user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      toast.success(`Welcome back, ${userData.full_name || 'Chef'}!`);
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials.';
      toast.error(msg);
      return false;
    }
  };

  const loginWithDemo = async () => {
    return await login('demo@aahaar.ai', 'Demo@12345');
  };

  const register = async (email, password, fullName) => {
    try {
      const res = await authService.register({ email, password, full_name: fullName });
      const { access_token, user: userData } = res.data;
      localStorage.setItem('aahaar_token', access_token);
      localStorage.setItem('aahaar_user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      toast.success('Account created successfully!');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('aahaar_token');
    localStorage.removeItem('aahaar_user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        loginWithDemo,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
