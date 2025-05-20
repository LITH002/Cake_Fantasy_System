import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './EditItem.css';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import AccessDenied from "../../Components/AccessDenied/AccessDenied";

const EditItem = ({ url }) => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { token, hasRole } = useContext(AdminAuthContext);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    cost_price: '',
    selling_price: '',
    unit: 'g',
    is_loose: false,
    min_order_quantity: '50',
    increment_step: '10',
    weight_value: '',
    weight_unit: 'g',
    pieces_per_pack: '',
    reorder_level: '5',
    barcode: '',
    customSKU: '',
    image: null
  });

  useEffect(() => {
    // Fetch item details when component mounts
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${url}/api/item/${itemId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          const item = response.data.data;
          setFormData({
            name: item.name || '',
            description: item.description || '',
            category: item.category || '',
            cost_price: item.cost_price || '',
            selling_price: item.selling_price || '',
            unit: item.unit || 'g',
            is_loose: item.is_loose || false,
            min_order_quantity: item.min_order_quantity || '50',
            increment_step: item.increment_step || '10',
            weight_value: item.weight_value || '',
            weight_unit: item.weight_unit || 'g',
            pieces_per_pack: item.pieces_per_pack || '',
            reorder_level: item.reorder_level || '5',
            barcode: item.barcode || '',
            customSKU: item.sku || '',
            image: null
          });
          setPreview(item.image);
        } else {
          toast.error("Failed to fetch item details");
          navigate('/list');
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
        toast.error(error.response?.data?.message || "Error loading item details");
        navigate('/list');
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [itemId, url, navigate, token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prevData => ({
        ...prevData,
        image: file
      }));

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create form data for submission
      const submitData = new FormData();
      submitData.append('item_id', itemId);
      
      // Append all fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description || '');
      submitData.append('cost_price', formData.cost_price);
      submitData.append('selling_price', formData.selling_price);
      submitData.append('unit', formData.unit);
      submitData.append('is_loose', formData.is_loose);
      submitData.append('min_order_quantity', formData.min_order_quantity);
      submitData.append('increment_step', formData.increment_step);
      submitData.append('weight_value', formData.weight_value || '');
      submitData.append('weight_unit', formData.weight_unit || 'g');
      submitData.append('pieces_per_pack', formData.pieces_per_pack || '');
      submitData.append('reorder_level', formData.reorder_level || '5');
      submitData.append('barcode', formData.barcode || '');
      submitData.append('customSKU', formData.customSKU || '');
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      // Send update request
      const response = await axios.post(`${url}/api/item/update`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success("Item updated successfully");
        navigate('/list');
      } else {
        toast.error(response.data.message || "Failed to update item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      console.log("Error response:", error.response);
      toast.error(error.response?.data?.message || "Error updating item");
    } finally {
      setLoading(false);
    }  };

  // Check if user has admin privileges
  if (!hasRole('admin')) {
    return <AccessDenied />;
  }

  if (loading) {
    return <div className="edit-page-loading">
      <div className="loading-spinner"></div>
      <p>Loading item details...</p>
    </div>;
  }

  return (
    <div className="edit-page-container">
      <div className="edit-page-header">
        <h1>Edit Item</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/list')}
        >
          Back to List
        </button>
      </div>

      <div className="edit-page-content">
        <div className="item-preview-section">
          <div className="preview-image-container">
            {preview ? (
              <img src={preview} alt="Item preview" className="item-preview-image" />
            ) : (
              <div className="no-image-placeholder">No Image Available</div>
            )}
          </div>
          <div className="current-details">
            <h3>Current Details</h3>
            <p className="detail-item"><span>Name:</span> {formData.name}</p>
            <p className="detail-item"><span>Category:</span> {formData.category}</p>
            <p className="detail-item"><span>SKU:</span> {formData.customSKU}</p>
            <p className="detail-item"><span>Cost Price:</span> LKR {formData.cost_price}</p>
            <p className="detail-item"><span>Selling Price:</span> LKR {formData.selling_price}</p>
            <p className="detail-item"><span>Unit:</span> {formData.unit}</p>
            {formData.is_loose && (
              <p className="detail-item"><span>Type:</span> Sold in loose quantities</p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="edit-page-form">
          <div className="form-section basic-details">
            <h3>Basic Details</h3>
            
            <div className="form-group">
              <label htmlFor="name">Item Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter item name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter item description"
                rows="5"
              />
            </div>

            <div className="form-group category-display">
              <label>Category</label>
              <p className="category-value">{formData.category}</p>
              <small>Category cannot be changed after item creation</small>
            </div>

            <div className="form-group">
              <label htmlFor="image">Update Image</label>
              <div className="file-input-container">
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                />
                <label htmlFor="image" className="custom-file-input">
                  Choose a file
                </label>
                <span className="file-name">
                  {formData.image ? formData.image.name : "No file chosen"}
                </span>
              </div>
            </div>
          </div>

          <div className="form-section pricing-details">
            <h3>Pricing & Inventory</h3>
            
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="cost_price">Cost Price (LKR)</label>
                <input
                  type="number"
                  id="cost_price"
                  name="cost_price"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={handleChange}
                  placeholder="Enter cost price"
                />
              </div>
              
              <div className="form-group half-width">
                <label htmlFor="selling_price">Selling Price (LKR)</label>
                <input
                  type="number"
                  id="selling_price"
                  name="selling_price"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={handleChange}
                  placeholder="Enter selling price"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="reorder_level">Reorder Level</label>
              <input
                type="number"
                id="reorder_level"
                name="reorder_level"
                min="1"
                value={formData.reorder_level}
                onChange={handleChange}
                placeholder="Enter reorder level"
              />
              <small className="form-helper-text">
                Minimum quantity before reordering is needed.
              </small>
            </div>
          </div>
          
          <div className="form-section measurement-details">
            <h3>Measurement & Quantity</h3>
            
            <div className="form-group">
              <label htmlFor="unit">Unit of Measurement</label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
              >
                <option value="g">Grams (g)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="piece">Piece</option>
              </select>
            </div>
            
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_loose"
                  checked={formData.is_loose}
                  onChange={handleChange}
                />
                <span>Sold in loose quantities</span>
              </label>
              <small className="form-helper-text">
                Enable for items sold by weight/volume (e.g., flour, liquid).
              </small>
            </div>
            
            {formData.is_loose && (
              <>
                <div className="form-row">
                  <div className="form-group half-width">
                    <label htmlFor="min_order_quantity">Min Order Quantity</label>
                    <input
                      type="number"
                      id="min_order_quantity"
                      name="min_order_quantity"
                      min="1"
                      step="1"
                      value={formData.min_order_quantity}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group half-width">
                    <label htmlFor="increment_step">Increment Step</label>
                    <input
                      type="number"
                      id="increment_step"
                      name="increment_step"
                      min="1"
                      step="1"
                      value={formData.increment_step}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <small className="form-helper-text">
                  Minimum order is {formData.min_order_quantity} {formData.unit}, increments by {formData.increment_step} {formData.unit}
                </small>
              </>
            )}
            
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="weight_value">Pkg Weight/Volume</label>
                <input
                  type="number"
                  id="weight_value"
                  name="weight_value"
                  min="0"
                  step="1"
                  value={formData.weight_value}
                  onChange={handleChange}
                  placeholder="e.g., 500"
                />
              </div>
              <div className="form-group half-width">
                <label htmlFor="weight_unit">Unit</label>
                <select
                  id="weight_unit"
                  name="weight_unit"
                  value={formData.weight_unit}
                  onChange={handleChange}
                >
                  <option value="g">Grams (g)</option>
                  <option value="ml">Milliliters (ml)</option>
                </select>
              </div>
            </div>
            
            {formData.category !== 'Cake Ingredients' && (
              <div className="form-group">
                <label htmlFor="pieces_per_pack">Pieces per Pack</label>
                <input
                  type="number"
                  id="pieces_per_pack"
                  name="pieces_per_pack"
                  min="1"
                  step="1"
                  value={formData.pieces_per_pack}
                  onChange={handleChange}
                  placeholder="e.g., 12"
                />
                <small className="form-helper-text">
                  Number of pieces in a pack (if applicable).
                </small>
              </div>
            )}
          </div>
          
          <div className="form-section identification-details">
            <h3>Identification</h3>
            
            <div className="form-group">
              <label htmlFor="barcode">Barcode</label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Enter barcode"
              />
              <small className="form-helper-text">
                If item has a barcode, scan it or enter it manually.
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="customSKU">Custom SKU</label>
              <input
                type="text"
                id="customSKU"
                name="customSKU"
                value={formData.customSKU}
                onChange={handleChange}
                placeholder="Enter custom SKU"
                disabled
              />
              <small className="form-helper-text">
                SKU cannot be changed after item creation.
              </small>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate('/list')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-btn"
              disabled={loading}
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItem;