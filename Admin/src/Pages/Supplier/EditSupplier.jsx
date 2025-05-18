import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import './Supplier.css';

const EditSupplier = ({ url }) => {
  const { supplierId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { token } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${url}/api/supplier/${supplierId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const supplier = response.data.data;
        setFormData({
          name: supplier.name || '',
          contact_person: supplier.contact_person || '',
          phone: supplier.phone || '',
          email: supplier.email || '',
          address: supplier.address || '',
          notes: supplier.notes || ''
        });
      } else {
        toast.error("Failed to fetch supplier details");
        navigate('/suppliers');
      }
    } catch (err) {
      console.error("Error fetching supplier details:", err);
      toast.error(err.response?.data?.message || "Error loading supplier");
      navigate('/suppliers');
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

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return false;
    }
    
    if (!formData.phone.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await axios.post(
        `${url}/api/supplier/update`,
        { 
          supplier_id: supplierId,
          ...formData
        },
        { 
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success("Supplier updated successfully");
        navigate('/suppliers');
      } else {
        toast.error(response.data.message || "Failed to update supplier");
      }
    } catch (err) {
      console.error("Error updating supplier:", err);
      toast.error(err.response?.data?.message || "Error updating supplier");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="suppliers-loading">
        <div className="loading-spinner"></div>
        <p>Loading supplier details...</p>
      </div>
    );
  }

  return (
    <div className="edit-supplier-container">
      <div className="edit-supplier-header">
        <h1>Edit Supplier</h1>
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
                required
              />
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
              {submitting ? "Updating..." : "Update Supplier"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditSupplier;