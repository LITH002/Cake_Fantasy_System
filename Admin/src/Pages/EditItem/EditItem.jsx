import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './EditItem.css';

const EditItem = ({ url }) => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null
  });

  useEffect(() => {
    // Fetch item details when component mounts
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${url}/api/item/${itemId}`);
        
        if (response.data.success) {
          const item = response.data.data;
          setFormData({
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
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
  }, [itemId, url, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
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
      
      // Only append fields that have values
      if (formData.name) submitData.append('name', formData.name);
      if (formData.description) submitData.append('description', formData.description);
      if (formData.price) submitData.append('price', formData.price);
      
      // Category is not included since it doesn't change
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      // Send update request
      const response = await axios.post(`${url}/api/item/update`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
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
      toast.error(error.response?.data?.message || "Error updating item");
    } finally {
      setLoading(false);
    }
  };

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
            <p className="detail-item"><span>Price:</span> LKR {formData.price}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="edit-page-form">
          <div className="form-section">
            <h3>Update Item Details</h3>
            
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

            <div className="form-group">
              <label htmlFor="price">Price (LKR)</label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
              />
            </div>

            <div className="form-group category-display">
              <label>Category</label>
              <p className="category-value">{formData.category}</p>
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