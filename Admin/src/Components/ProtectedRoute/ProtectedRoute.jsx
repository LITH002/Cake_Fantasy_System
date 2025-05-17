import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';

const ProtectedRoute = ({ children, requiredRole = 'admin' }) => {
  const { isAuthenticated, hasRole, loading } = useContext(AdminAuthContext);
  
  // Show loading state
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role permissions
  if (!hasRole(requiredRole)) {
    toast.error("You don't have permission to access this page");
    return <Navigate to="/list" replace />;
  }
  
  // If authenticated and has required role, render the children
  return children;
};

export default ProtectedRoute;