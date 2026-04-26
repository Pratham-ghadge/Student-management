import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('sms_token');
      const storedUser = localStorage.getItem('sms_user');

      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          setToken(storedToken);
        } catch (error) {
          logout();
        }
      } else if (storedUser) {
        // Just in case token is missing but user is there
        logout();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('sms_token', newToken);
    localStorage.setItem('sms_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
