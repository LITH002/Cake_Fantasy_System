import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';
import AccessDenied from '../AccessDenied/AccessDenied';

const ProtectedRoute = ({ children, requiredRole = 'employee' }) => {
  const { isAuthenticated, hasRole, loading } = useContext(AdminAuthContext);
  
  // Show loading state
  if (loading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check role permissions
  if (!hasRole(requiredRole)) {
    toast.error("You don't have permission to access this page");
    return <AccessDenied />;
  }
  
  // If authenticated and has required role, render the children
  return children;
};

export default ProtectedRoute;