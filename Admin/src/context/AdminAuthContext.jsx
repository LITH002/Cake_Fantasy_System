import React, { createContext, useState, useEffect } from 'react';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = (newToken, userData) => {
    localStorage.setItem('adminToken', newToken);
    localStorage.setItem('adminUser', JSON.stringify(userData));
    
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Check if user has required role
  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    // If requiredRole is "owner" only owner can access
    if (requiredRole === 'owner') {
      return user.role === 'owner';
    }
    
    // If requiredRole is "employee" both employee and owner can access
    if (requiredRole === 'employee') {
      return user.role === 'employee' || user.role === 'owner';
    }
    
    // Admin role check (more general, for regular admin areas)
    if (requiredRole === 'admin') {
      return user.role === 'employee' || user.role === 'owner';
    }
    
    return false;
  };

  const value = {
    isAuthenticated,
    token,
    user,
    loading,
    login,
    logout,
    hasRole
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};