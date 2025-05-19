import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./Add.css";
import assets from "../../assets/assets";
import { toast } from "react-toastify";
import axios from "axios";
import { AdminAuthContext } from '../../context/AdminAuthContext';

const Add = ({url}) => {
  const navigate = useNavigate();
  const { token } = useContext(AdminAuthContext);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: '',
    description: '',
    category: 'Cake Ingredients', 
    barcode: '',
    customSKU: '',
    cost_price: '',
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    // Validate required fields
    if (!data.name || !data.category || !data.cost_price) {
      toast.error("Name, category and cost price are required");
      return;
    }

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description || '');
    formData.append("category", data.category);
    formData.append("cost_price", data.cost_price);
    
    // Only append optional fields if they have values
    if (data.barcode) formData.append("barcode", data.barcode);
    if (data.customSKU) formData.append("customSKU", data.customSKU);
    if (image) formData.append("image", image);

    try {
      setLoading(true);
      const response = await axios.post(
        `${url}/api/item/add`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Item added successfully");
        
        // If a SKU was generated, show it
        if (response.data.sku) {
          toast.info(`Item SKU: ${response.data.sku}`);
        }
        
        // Reset form
        setData({
          name: "",
          description: "",
          category: "Cake Ingredients",
          barcode: "",
          customSKU: "",
          cost_price: ""
        });
        setImage(null);
        
      } else {
        toast.error(response.data.message || "Failed to add item");
      }
    } catch (error) {
      console.error("Error while adding item:", error);
      toast.error(error.response?.data?.message || "Something went wrong while adding the item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-item-container">
      <div className="add-item-header">
        <h2>Add New Item</h2>
        <button className="back-btn" onClick={() => navigate('/list')}>Back to Items</button>
      </div>

      <form className="add-item-form" onSubmit={onSubmitHandler}>
        <div className="form-columns">
          <div className="form-column">
            <div className="add-img-upload">
              <label className="form-label">Item Image</label>
              <div className="image-upload-container">
                <label htmlFor="image" className="image-upload-label">
                  <img
                    src={image ? URL.createObjectURL(image) : assets.upload_area}
                    alt="Upload"
                    className="upload-preview"
                  />
                  <div className="upload-text">
                    {image ? "Change Image" : "Click to Upload"}
                  </div>
                </label>
                <input 
                  onChange={(e) => setImage(e.target.files[0])} 
                  type="file" 
                  id="image" 
                  accept="image/*"
                  hidden 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="category">Item Category*</label>
              <select 
                id="category" 
                name="category" 
                value={data.category} 
                onChange={onChangeHandler}
                required
                className="form-input"
              >
                <option value="Cake Ingredients">Cake Ingredients</option>
                <option value="Cake Tools">Cake Tools</option>
                <option value="Party Items">Party Items</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cost_price">Cost Price (LKR)*</label>
              <input 
                type="number" 
                id="cost_price" 
                name="cost_price" 
                value={data.cost_price} 
                onChange={onChangeHandler}
                placeholder="0.00" 
                min="0" 
                step="0.01"
                required
                className="form-input"
              />
              <small className="form-helper-text">
                Initial purchase price. Selling price will be set during GRN.
              </small>
            </div>
          </div>

          <div className="form-column">
            <div className="form-group">
              <label className="form-label" htmlFor="name">Item Name*</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={data.name} 
                onChange={onChangeHandler}
                placeholder="Enter item name"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Item Description</label>
              <textarea 
                id="description" 
                name="description" 
                rows="4" 
                value={data.description} 
                onChange={onChangeHandler}
                placeholder="Enter item description"
                className="form-input textarea"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="barcode">Barcode (Optional)</label>
              <input 
                type="text" 
                id="barcode" 
                name="barcode" 
                value={data.barcode} 
                onChange={onChangeHandler}
                placeholder="Scan existing barcode"
                className="form-input"
              />
              <small className="form-helper-text">
                If item has a barcode, scan it or enter it manually.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="customSKU">Custom SKU (Optional)</label>
              <input 
                type="text" 
                id="customSKU" 
                name="customSKU" 
                value={data.customSKU} 
                onChange={onChangeHandler}
                placeholder="Enter custom SKU if needed"
                className="form-input"
              />
              <small className="form-helper-text">
                Leave blank for auto-generated SKU. Will be replaced by barcode if provided.
              </small>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/list')}>Cancel</button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="button-spinner"></span>
                Adding...
              </>
            ) : (
              "Add Item"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Add;