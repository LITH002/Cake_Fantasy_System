import React from 'react';
import './AccessDenied.css';

const AccessDenied = () => {
  return (
    <div className="access-denied">
      <div className="access-denied-content">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this feature.</p>
        <p className="small">Please contact an administrator if you need access.</p>
      </div>
    </div>
  );
};

export default AccessDenied;
