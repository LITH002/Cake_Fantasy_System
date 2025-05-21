import React, { useContext, useState, useEffect } from 'react';
import './Navbar.css';
import { assets } from '../../assets/assets';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, logout } = useContext(AdminAuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown')) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className='navbar'>
      <img className='logo' src={assets.font} alt="Cake Fantasy" />
      
      {user && (
        <div className="user-section">
          <div className="user-info">
            <p className="user-name">{user.firstName} {user.lastName}</p>
            <p className={`user-role ${user.role}`}>
              {user.role === 'owner' ? 'Owner' : user.role === 'admin' ? 'Admin' : 'Employee'}
            </p>
          </div>
          
          <div className="dropdown">
            <button className="dropdown-toggle" onClick={toggleDropdown} aria-label="User menu">
              <span className="arrow-down"></span>
            </button>
            
            {showDropdown && (
              <div className="dropdown-menu">
                <button 
                  className="logout-btn" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;