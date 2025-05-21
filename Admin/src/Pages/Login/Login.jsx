import React, { useState, useContext } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';
import axios from 'axios';

const Login = ({ url }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useContext(AdminAuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Attempting login at ${url}/api/admin/login with email: ${credentials.email}`);
      
      // Use the admin login endpoint instead of the regular user login
      const response = await axios.post(`${url}/api/admin/login`, credentials);
      
      if (response.data.success) {
        console.log("Login successful:", response.data.user);
        // Store the token and user info
        login(response.data.token, response.data.user);
        
        // Show success message
        toast.success(`Welcome back, ${response.data.user.firstName}!`);
        
        // Redirect to the list page
        navigate('/list');
      } else {
        console.error("Login failed:", response.data);
        toast.error(response.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        console.error("Error response:", error.response.status, error.response.data);
      }
      
      if (error.response?.status === 401) {
        toast.error("Invalid credentials. Please check your email and password.");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. Admin privileges required.");
      } else {
        toast.error(error.response?.data?.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <img src={assets.font} alt="Cake Fantasy" className="login-logo" />
          <h2>Admin Panel</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group flex-col">
            <p>Email</p>
            <input 
              type="email" 
              name="email" 
              value={credentials.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              required
            />
          </div>
          
          <div className="form-group flex-col">
            <p>Password</p>
            <input 
              type="password" 
              name="password" 
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn" 
            disabled={loading}
          >
            {loading ? "Logging in..." : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;