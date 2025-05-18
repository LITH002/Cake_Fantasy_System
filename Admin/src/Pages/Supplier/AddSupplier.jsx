import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import './Supplier.css';

const AddSupplier = ({ url }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [existingSuppliers, setExistingSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { token } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  // Fetch existing suppliers on component mount
  useEffect(() => {
    fetchExistingSuppliers();
  }, []);

  const fetchExistingSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${url}/api/supplier/list`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setExistingSuppliers(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Format phone number for consistent comparison
  const formatPhoneForComparison = (phone) => {
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  };

  const checkForDuplicates = () => {
    // Check for duplicate name (case insensitive)
    const nameExists = existingSuppliers.some(
      supplier => supplier.name.toLowerCase() === formData.name.toLowerCase()
    );
    
    if (nameExists) {
      toast.error("A supplier with this name already exists");
      return true;
    }
    
    // Check for duplicate phone (ignoring formatting)
    const formattedPhone = formatPhoneForComparison(formData.phone);
    const phoneExists = existingSuppliers.some(supplier => {
      const existingPhone = formatPhoneForComparison(supplier.phone);
      return existingPhone === formattedPhone;
    });
    
    if (phoneExists) {
      toast.error("A supplier with this phone number already exists");
      return true;
    }
    
    // Check for duplicate email if provided
    if (formData.email) {
      const emailExists = existingSuppliers.some(
        supplier => supplier.email && supplier.email.toLowerCase() === formData.email.toLowerCase()
      );
      
      if (emailExists) {
        toast.error("A supplier with this email already exists");
        return true;
      }
    }
    
    return false; // No duplicates found
  };

  const validateForm = () => {
    // Only name and phone are required
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return false;
    }
    
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    
    // Improved phone validation for Sri Lankan numbers
    const phoneRegex = /^(?:(?:\+94)|0)?[ -]?(?:\d[ -]?){9,10}$/;
    
    if (!phoneRegex.test(formData.phone.replace(/\s+/g, ' '))) {
      toast.error("Please enter a valid Sri Lankan phone number");
      return false;
    }
    
    // If email is provided, validate its format
    if (formData.email && !isValidEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    
    // Check for duplicates
    if (checkForDuplicates()) {
      return false;
    }
    
    return true;
  };
  
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await axios.post(
        `${url}/api/supplier/add`,
        formData,
        { 
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Supplier added successfully");
        navigate('/suppliers');
      } else {
        toast.error(response.data.message || "Failed to add supplier");
      }
    } catch (err) {
      console.error("Error adding supplier:", err);
      
      // More detailed error handling
      if (err.response) {
        console.error("Error response:", err.response.data);
        toast.error(err.response.data?.message || "Error adding supplier");
      } else if (err.request) {
        console.error("No response received");
        toast.error("No response from server. Please check your connection");
      } else {
        console.error("Request setup error");
        toast.error("Error setting up request: " + err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while fetching existing suppliers
  if (loading) {
    return (
      <div className="suppliers-loading">
        <div className="loading-spinner"></div>
        <p>Loading supplier data...</p>
      </div>
    );
  }

  // Render form
  return (
    <div className="add-supplier-container">
      <div className="add-supplier-header">
        <h1>Add New Supplier</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/suppliers')}
        >
          Back to Suppliers
        </button>
      </div>

      <form onSubmit={handleSubmit} className="supplier-form">
        <div className="supplier-form-card">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Supplier Name*</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contact_person">Contact Person</label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
              />
              <small className="form-hint">Optional</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number*</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g., +94 712345678"
                required
              />
              <small className="form-hint">Format: +94 712345678 or 0712345678</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <small className="form-hint">Optional</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="2"
            />
            <small className="form-hint">Optional</small>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
            />
            <small className="form-hint">Optional</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/suppliers')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add Supplier"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddSupplier;