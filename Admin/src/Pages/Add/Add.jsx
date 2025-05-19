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
    selling_price: '',
    unit: 'g',
    is_loose: false,
    min_order_quantity: '50',
    increment_step: '10',
    weight_value: '',
    weight_unit: 'g',
    pieces_per_pack: '',
    reorder_level: '5'
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    let value = event.target.value;
    
    // Handle checkbox for loose items
    if (name === 'is_loose') {
      value = event.target.checked;
    }
    
    // Update the unit based on category
    if (name === 'category') {
      const newUnit = value === 'Cake Ingredients' ? 'g' : 'piece';
      const newIsLoose = value === 'Cake Ingredients';
      
      setData((prevData) => ({ 
        ...prevData, 
        [name]: value,
        unit: newUnit,
        is_loose: newIsLoose,
        min_order_quantity: newIsLoose ? '50' : '1',
        increment_step: newIsLoose ? '10' : '1'
      }));
      return;
    }
    
    setData((prevData) => ({ ...prevData, [name]: value }));
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
    formData.append("selling_price", data.selling_price || data.cost_price);
    
    // Add the new fields
    formData.append("unit", data.unit);
    formData.append("is_loose", data.is_loose);
    formData.append("min_order_quantity", data.min_order_quantity);
    formData.append("increment_step", data.increment_step);
    formData.append("weight_value", data.weight_value || '');
    formData.append("weight_unit", data.weight_unit || 'g');
    formData.append("pieces_per_pack", data.pieces_per_pack || '');
    formData.append("reorder_level", data.reorder_level || '5');
    
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
          cost_price: "",
          selling_price: "",
          unit: "g",
          is_loose: true,
          min_order_quantity: "50",
          increment_step: "10",
          weight_value: "",
          weight_unit: "g",
          pieces_per_pack: "",
          reorder_level: "5"
        });
        setImage(null);
        
        // Navigate back to the list
        navigate('/list');
        
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
                Initial purchase price.
              </small>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="selling_price">Selling Price (LKR)</label>
              <input 
                type="number" 
                id="selling_price" 
                name="selling_price" 
                value={data.selling_price} 
                onChange={onChangeHandler}
                placeholder="0.00" 
                min="0" 
                step="0.01"
                className="form-input"
              />
              <small className="form-helper-text">
                Leave blank to use cost price initially. Can be updated during GRN.
              </small>
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="reorder_level">Reorder Level</label>
              <input 
                type="number" 
                id="reorder_level" 
                name="reorder_level" 
                value={data.reorder_level} 
                onChange={onChangeHandler}
                placeholder="5" 
                min="1" 
                className="form-input"
              />
              <small className="form-helper-text">
                Minimum quantity before reordering is needed.
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
              <label className="form-label" htmlFor="unit">Unit of Measurement</label>
              <select 
                id="unit" 
                name="unit" 
                value={data.unit} 
                onChange={onChangeHandler}
                className="form-input"
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
                  checked={data.is_loose} 
                  onChange={onChangeHandler}
                />
                <span>Sold in loose quantities</span>
              </label>
              <small className="form-helper-text">
                Enable for items sold by weight/volume (e.g., flour, liquid).
              </small>
            </div>
            
            {data.is_loose && (
              <>
                <div className="form-row">
                  <div className="form-group half-width">
                    <label className="form-label" htmlFor="min_order_quantity">Min Order Quantity</label>
                    <input 
                      type="number" 
                      id="min_order_quantity" 
                      name="min_order_quantity" 
                      value={data.min_order_quantity} 
                      onChange={onChangeHandler}
                      min="1" 
                      step="1"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group half-width">
                    <label className="form-label" htmlFor="increment_step">Increment Step</label>
                    <input 
                      type="number" 
                      id="increment_step" 
                      name="increment_step" 
                      value={data.increment_step} 
                      onChange={onChangeHandler}
                      min="1" 
                      step="1"
                      className="form-input"
                    />
                  </div>
                </div>
                <small className="form-helper-text">
                  Minimum order is {data.min_order_quantity} {data.unit}, increments by {data.increment_step} {data.unit}
                </small>
              </>
            )}
            
            <div className="form-row">
              <div className="form-group half-width">
                <label className="form-label" htmlFor="weight_value">Pkg Weight/Volume</label>
                <input 
                  type="number" 
                  id="weight_value" 
                  name="weight_value" 
                  value={data.weight_value} 
                  onChange={onChangeHandler}
                  placeholder="e.g., 500" 
                  min="0" 
                  step="1"
                  className="form-input"
                />
              </div>
              <div className="form-group half-width">
                <label className="form-label" htmlFor="weight_unit">Unit</label>
                <select 
                  id="weight_unit" 
                  name="weight_unit" 
                  value={data.weight_unit} 
                  onChange={onChangeHandler}
                  className="form-input"
                >
                  <option value="g">Grams (g)</option>
                  <option value="ml">Milliliters (ml)</option>
                </select>
              </div>
            </div>
            
            {data.category !== 'Cake Ingredients' && (
              <div className="form-group">
                <label className="form-label" htmlFor="pieces_per_pack">Pieces per Pack</label>
                <input 
                  type="number" 
                  id="pieces_per_pack" 
                  name="pieces_per_pack" 
                  value={data.pieces_per_pack} 
                  onChange={onChangeHandler}
                  placeholder="e.g., 12" 
                  min="1" 
                  step="1"
                  className="form-input"
                />
                <small className="form-helper-text">
                  Number of pieces in a pack (if applicable).
                </small>
              </div>
            )}
            
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