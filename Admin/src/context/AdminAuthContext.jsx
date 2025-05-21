import React, { createContext, useState, useEffect } from 'react';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Restoring session:', { 
          token: storedToken ? `${storedToken.substring(0, 10)}...` : 'none',
          user: parsedUser ? parsedUser.username : 'none' 
        });
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid storage data
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setAuthError('Invalid session data');
      }
    } else {
      console.log('No stored session found');
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = (newToken, userData) => {
    console.log('Login successful:', { 
      user: userData.username,
      role: userData.role
    });
    
    localStorage.setItem('adminToken', newToken);
    localStorage.setItem('adminUser', JSON.stringify(userData));
    
    setToken(newToken);
    setUser(userData);
    setIsAuthenticated(true);
    setAuthError(null);
  };

  // Logout function
  const logout = () => {
    console.log('Logging out user:', user?.username);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };
  
  // Check if user has required role
  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    // Define role hierarchy
    const roleHierarchy = {
      'employee': 1,
      'admin': 2, 
      'owner': 3
    };
    
    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
    
    // User can access if their role level is greater than or equal to the required level
    return userRoleLevel >= requiredRoleLevel;
  };

  const value = {
    isAuthenticated,
    token,
    user,
    loading,
    authError,
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