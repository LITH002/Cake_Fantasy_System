import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import SearchDropdown from '../../Components/SearchDropdown/SearchDropdown';
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog';
import './CreateGRN.css';

const CreateGRN = ({ url }) => {
  const [formData, setFormData] = useState({
    supplierId: '',
    referenceNumber: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ 
      itemId: '', 
      name: '', 
      category: 'Cake Ingredients', 
      quantity: 1, 
      unitPrice: '' 
    }]
  });
  
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  
  const { token } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
    fetchItems();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${url}/api/supplier/list`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setSuppliers(response.data.data);
      } else {
        toast.error("Failed to fetch suppliers");
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      toast.error(err.response?.data?.message || "Error loading suppliers");
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get(
        `${url}/api/item/list`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSearchItemSelect = (index, selectedItem) => {
    const updatedItems = [...formData.items];
    
    if (selectedItem.id === 'new') {
      // For new items
      updatedItems[index] = {
        ...updatedItems[index],
        itemId: '',
        name: selectedItem.name,
        category: 'Cake Ingredients',
        // Keep existing quantity
        unitPrice: ''
      };
    } else {
      // For existing items
      updatedItems[index] = {
        ...updatedItems[index],
        itemId: selectedItem.id,
        name: selectedItem.name,
        category: selectedItem.category,
        // Keep existing quantity
        unitPrice: updatedItems[index].unitPrice || selectedItem.price
      };
    }
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items, 
        { 
          itemId: '', 
          name: '', 
          category: 'Cake Ingredients', 
          quantity: 1, 
          unitPrice: '' 
        }
      ]
    });
  };

  const handleRemoveClick = (index) => {
    if (formData.items.length <= 1) {
      toast.warning("You need at least one item in the GRN");
      return;
    }
    
    setItemToRemove(index);
    setIsConfirmOpen(true);
  };

  const confirmRemove = () => {
    const updatedItems = formData.items.filter((_, i) => i !== itemToRemove);
    setFormData({
      ...formData,
      items: updatedItems
    });
    setIsConfirmOpen(false);
  };

  const cancelRemove = () => {
    setIsConfirmOpen(false);
    setItemToRemove(null);
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const itemTotal = item.quantity * (parseFloat(item.unitPrice) || 0);
      return total + itemTotal;
    }, 0);
  };

  const validateForm = () => {
    if (!formData.supplierId) {
      toast.error("Please select a supplier");
      return false;
    }

    if (!formData.referenceNumber) {
      toast.error("Please enter a reference number");
      return false;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      
      // Check if item is selected from dropdown or has name entered
      if (!item.name) {
        toast.error(`Please select or enter item name for item #${i + 1}`);
        return false;
      }
      
      if (isNaN(item.quantity) || item.quantity <= 0) {
        toast.error(`Quantity must be a positive number for item #${i + 1}`);
        return false;
      }
      
      if (isNaN(item.unitPrice) || parseFloat(item.unitPrice) <= 0) {
        toast.error(`Unit price must be a positive number for item #${i + 1}`);
        return false;
      }
    }

    return true;
  };

  // Update the handleSubmit function in CreateGRN.jsx to include better debugging:

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  try {
    setSubmitting(true);
    
    // Format data to match backend expectations
    const submitData = {
      supplier_id: parseInt(formData.supplierId),
      po_reference: formData.referenceNumber,         // Changed field name
      received_date: formData.deliveryDate,           // Changed field name
      notes: formData.notes,
      items: formData.items.map(item => ({
        item_id: item.itemId ? parseInt(item.itemId) : null,
        name: item.name,
        category: item.category,
        received_quantity: parseInt(item.quantity),    // Changed field name
        unit_price: parseFloat(item.unitPrice)
      }))
    };
    
    console.log("Submitting GRN data:", submitData);
    
    const response = await axios.post(
      `${url}/api/grn/create`,                         // Correct endpoint
      submitData,
      { 
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("GRN response:", response.data);
    
    if (response.data.success) {
      toast.success("GRN created successfully");
      navigate('/grn');
    } else {
      toast.error(response.data.message || "Failed to create GRN");
    }
  } catch (err) {
    console.error("Error creating GRN:", err);
    
    if (err.response) {
      console.error("Server response error:", err.response.data);
      toast.error(err.response.data?.message || "Error creating GRN");
    } else if (err.request) {
      console.error("No response received", err.request);
      toast.error("No response from server. Please check your connection");
    } else {
      console.error("Request error:", err.message);
      toast.error(`Error creating GRN: ${err.message}`);
    }
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="create-grn-container">
      <div className="create-grn-header">
        <h1>Create New GRN</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/grn')}
        >
          Back to GRN List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="create-grn-form">
        <div className="grn-form-card">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supplierId">Supplier</label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="referenceNumber">Reference Number</label>
              <input
                type="text"
                id="referenceNumber"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleInputChange}
                placeholder="e.g. INV-001"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="deliveryDate">Delivery Date</label>
              <input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                value={formData.deliveryDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="2"
              placeholder="Any additional notes about this GRN"
            />
          </div>

          <div className="items-section">
            <div className="items-header">
              <h3>Items</h3>
              <button 
                type="button" 
                className="add-item-btn"
                onClick={addItem}
              >
                Add Item
              </button>
            </div>
            
            <div className="items-table-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Unit Price (LKR)</th>
                    <th>Total (LKR)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="search-dropdown-cell">
                        {/* Replace select with SearchDropdown component */}
                        <SearchDropdown 
                          allItems={items}
                          onItemSelect={(selectedItem) => handleSearchItemSelect(index, selectedItem)}
                        />
                        {/* Display selected item name as readonly if already selected */}
                        {item.name && (
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            className="item-name-input"
                            required
                          />
                        )}
                      </td>
                      <td>
                        <select
                          value={item.category}
                          onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                          required
                        >
                          <option value="Cake Ingredients">Cake Ingredients</option>
                          <option value="Cake Tools">Cake Tools</option>
                          <option value="Party Items">Party Items</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                          required
                        />
                      </td>
                      <td className="item-total">
                        {((item.quantity || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className="remove-item-btn"
                          onClick={() => handleRemoveClick(index)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="total-label">Total Amount:</td>
                    <td colSpan="2" className="total-value">LKR {calculateTotal().toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/grn')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create GRN"}
            </button>
          </div>
        </div>
      </form>
      
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Removal"
        message="Are you sure you want to remove this item from the GRN?"
        onConfirm={confirmRemove}
        onCancel={cancelRemove}
      />
    </div>
  );
};

export default CreateGRN;