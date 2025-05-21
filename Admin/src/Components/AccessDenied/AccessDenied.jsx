import React from 'react';
import './AccessDenied.css';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
  const navigate = useNavigate();
  
  return (
    <div className="access-denied">
      <div className="access-denied-content">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this feature.</p>
        <p className="small">Please contact an administrator if you need access.</p>
        <button 
          onClick={() => navigate('/list')} 
          className="back-button"
        >
          Return to Inventory
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
