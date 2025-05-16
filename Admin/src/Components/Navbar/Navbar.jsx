import React, { useContext } from 'react';
import './Navbar.css';
import { assets } from '../../assets/assets';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, logout } = useContext(AdminAuthContext);
  
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <div className='navbar'>
      <img className='logo' src={assets.font} alt="Cake Fantasy" />
      
      {user && (
        <div className="user-section">
          <div className="user-info">
            <p className="user-name">{user.firstName} {user.lastName}</p>
            <p className="user-role">{user.role === 'owner' ? 'Owner' : 'Employee'}</p>
          </div>
          
          <div className="profile-dropdown">
            <img className='profile' src={assets.profile_image} alt="Profile" />
            <div className="dropdown-content">
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;