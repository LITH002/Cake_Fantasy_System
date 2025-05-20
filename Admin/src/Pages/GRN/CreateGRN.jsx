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
      unitPrice: '',
      sellingPrice: '',
      sku: '',
      barcode: '',
      unit: 'g',
      isNew: true
    }]
  });
  
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  
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

  const generateSKU = (category, index) => {
    const prefixes = {
      'Cake Ingredients': 'CI',
      'Cake Tools': 'CT',
      'Party Items': 'PI'
    };
    const prefix = prefixes[category] || 'IT';
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${timestamp}${randomNum}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // Generate SKU for new items when category changes
    if (field === 'category' && updatedItems[index].isNew) {
      updatedItems[index].sku = generateSKU(value, index);
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
    
    validateItemField(index, field, value);
  };

  const handleSearchItemSelect = (index, selectedItem) => {
    const updatedItems = [...formData.items];
    
    if (selectedItem.id === 'new') {
      const newCategory = 'Cake Ingredients';
      updatedItems[index] = {
        ...updatedItems[index],
        itemId: '',
        name: selectedItem.name,
        category: newCategory,
        quantity: updatedItems[index].quantity || 1,
        unitPrice: '',
        sellingPrice: '',
        sku: generateSKU(newCategory, index),
        barcode: '',
        unit: 'g',
        isNew: true
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        itemId: selectedItem.id,
        name: selectedItem.name,
        category: selectedItem.category,
        quantity: updatedItems[index].quantity || 1,
        unitPrice: updatedItems[index].unitPrice || selectedItem.cost_price || '',
        sellingPrice: updatedItems[index].sellingPrice || selectedItem.selling_price || '',
        sku: selectedItem.sku || '',
        barcode: selectedItem.barcode || '',
        unit: selectedItem.unit || 'piece',
        isNew: false
      };
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
    
    // Validate the item after selection
    validateItem(index);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items, 
        { 
          itemId: '', 
          name: '', 
          category: 'Cake Ingredients', 
          quantity: 1, 
          unitPrice: '',
          sellingPrice: '',
          sku: generateSKU('Cake Ingredients'),
          barcode: '',
          unit: 'g',
          isNew: true
        }
      ]
    }));
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
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
    setIsConfirmOpen(false);
    setItemToRemove(null);
  };

  const cancelRemove = () => {
    setIsConfirmOpen(false);
    setItemToRemove(null);
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * (parseFloat(item.unitPrice) || 0));
    }, 0);
  };

  const validateField = (name, value) => {
    let error = '';
    
    if (!value) {
      if (name === 'supplierId') error = 'Supplier is required';
      if (name === 'referenceNumber') error = 'Reference number is required';
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateItemField = (index, field, value) => {
    let error = '';
    
    if (!value && field === 'name') {
      error = 'Item name is required';
    } else if ((field === 'quantity' || field === 'unitPrice') && (!value || isNaN(value) || parseFloat(value) <= 0)) {
      error = field === 'quantity' ? 'Must be > 0' : 'Must be a positive number';
    }
    
    setErrors(prev => {
      const itemErrors = { ...(prev.items || {}) };
      if (!itemErrors[index]) itemErrors[index] = {};
      itemErrors[index][field] = error;
      return { ...prev, items: itemErrors };
    });
  };

  const validateItem = (index) => {
    const item = formData.items[index];
    const itemErrors = {};
    
    if (!item.name) itemErrors.name = 'Item name is required';
    if (!item.quantity || isNaN(item.quantity) || parseFloat(item.quantity) <= 0) {
      itemErrors.quantity = 'Must be > 0';
    }
    if (!item.unitPrice || isNaN(item.unitPrice) || parseFloat(item.unitPrice) <= 0) {
      itemErrors.unitPrice = 'Must be a positive number';
    }
    
    setErrors(prev => {
      const itemsErrors = { ...(prev.items || {}) };
      itemsErrors[index] = itemErrors;
      return { ...prev, items: itemsErrors };
    });
    
    return Object.keys(itemErrors).length === 0;
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};
    
    // Validate main form fields
    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required';
      isValid = false;
    }
    
    if (!formData.referenceNumber) {
      newErrors.referenceNumber = 'Reference number is required';
      isValid = false;
    }
    
    // Validate each item
    const itemErrors = {};
    formData.items.forEach((item, index) => {
      const itemValid = validateItem(index);
      if (!itemValid) {
        itemErrors[index] = true;
        isValid = false;
      }
    });
    
    if (Object.keys(itemErrors).length > 0) {
      newErrors.items = itemErrors;
    }
    
    setErrors(newErrors);
    
    if (!isValid) {
      toast.error("Please fix the errors in the form");
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
      
      const submitData = {
        supplier_id: parseInt(formData.supplierId),
        po_reference: formData.referenceNumber,
        received_date: formData.deliveryDate,
        notes: formData.notes,
        items: formData.items.map(item => ({
          received_quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unitPrice),
          selling_price: item.sellingPrice ? parseFloat(item.sellingPrice) : null,
          ...(item.itemId 
            ? { item_id: parseInt(item.itemId) }
            : { 
                name: item.name,
                category: item.category,
                sku: item.sku,
                barcode: item.barcode || '',
                unit: item.unit
              })
        }))
      };
      
      const response = await axios.post(
        `${url}/api/grn/create`,
        submitData,
        { 
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success("GRN created successfully");
        navigate('/grn');
      } else {
        toast.error(response.data.message || "Failed to create GRN");
      }
    } catch (err) {
      console.error("Error creating GRN:", err);
      let errorMessage = "Error creating GRN";
      
      if (err.response) {
        if (err.response.data?.errors) {
          // Handle validation errors from server
          const serverErrors = err.response.data.errors;
          errorMessage = "Please fix the following errors:";
          
          Object.keys(serverErrors).forEach(field => {
            errorMessage += `\n- ${serverErrors[field].join(', ')}`;
          });
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlur = (field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleItemBlur = (index, field) => {
    setTouchedFields(prev => {
      const itemsTouched = { ...(prev.items || {}) };
      if (!itemsTouched[index]) itemsTouched[index] = {};
      itemsTouched[index][field] = true;
      return { ...prev, items: itemsTouched };
    });
  };

  const hasError = (field) => {
    return touchedFields[field] && errors[field];
  };

  const hasItemError = (index, field) => {
    return touchedFields.items?.[index]?.[field] && errors.items?.[index]?.[field];
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
            <div className={`form-group ${hasError('supplierId') ? 'has-error' : ''}`}>
              <label htmlFor="supplierId">Supplier *</label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleInputChange}
                onBlur={() => handleBlur('supplierId')}
                required
              >
                <option value="">Select a supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {hasError('supplierId') && (
                <div className="error-message">{errors.supplierId}</div>
              )}
            </div>
            
            <div className={`form-group ${hasError('referenceNumber') ? 'has-error' : ''}`}>
              <label htmlFor="referenceNumber">Invoice Number *</label>
              <input
                type="text"
                id="referenceNumber"
                name="referenceNumber"
                value={formData.referenceNumber}
                onChange={handleInputChange}
                onBlur={() => handleBlur('referenceNumber')}
                placeholder="e.g. INV-001"
                required
              />
              {hasError('referenceNumber') && (
                <div className="error-message">{errors.referenceNumber}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="deliveryDate">Purchased Date *</label>
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
                    <th>Item *</th>
                    <th className="item-code-col">SKU/Barcode</th>
                    <th>Category</th>
                    <th>Quantity *</th>
                    <th>Unit Price (LKR) *</th>
                    <th>Selling Price (LKR)</th>
                    <th>Total (LKR)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <React.Fragment key={index}>
                      <tr className={Object.values(errors.items?.[index] || {}).some(Boolean) ? 'has-error-row' : ''}>
                        <td className="search-dropdown-cell">
                          <SearchDropdown 
                            allItems={items}
                            onItemSelect={(selectedItem) => handleSearchItemSelect(index, selectedItem)}
                          />
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            onBlur={() => handleItemBlur(index, 'name')}
                            className={`item-name-input ${hasItemError(index, 'name') ? 'has-error' : ''}`}
                            placeholder="Enter item name"
                            required
                          />
                          {hasItemError(index, 'name') && (
                            <div className="error-message">{errors.items[index].name}</div>
                          )}
                        </td>
                        <td className="item-code-col">
                          {item.isNew ? (
                            <span className="sku-badge">{item.sku || 'Auto-generated'}</span>
                          ) : (
                            <span className="sku-badge">{item.sku || item.barcode || 'N/A'}</span>
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
                          <div className="quantity-with-unit">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              onBlur={() => handleItemBlur(index, 'quantity')}
                              min={item.is_loose ? "0.1" : "1"}
                              step={item.is_loose ? "0.1" : "1"}
                              className={hasItemError(index, 'quantity') ? 'has-error' : ''}
                              required
                            />
                            {item.isNew ? (
                              <select
                                value={item.unit}
                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                className="unit-selector"
                              >
                                {item.category === 'Cake Ingredients' ? (
                                  <>
                                    <option value="g">g</option>
                                    <option value="ml">ml</option>
                                    <option value="piece">piece</option>
                                  </>
                                ) : (
                                  <option value="piece">piece</option>
                                )}
                              </select>
                            ) : (
                              <span className="unit-display">{item.unit}</span>
                            )}
                          </div>
                          {hasItemError(index, 'quantity') && (
                            <div className="error-message">{errors.items[index].quantity}</div>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                            onBlur={() => handleItemBlur(index, 'unitPrice')}
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            className={hasItemError(index, 'unitPrice') ? 'has-error' : ''}
                            required
                          />
                          {hasItemError(index, 'unitPrice') && (
                            <div className="error-message">{errors.items[index].unitPrice}</div>
                          )}
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.sellingPrice}
                            onChange={(e) => handleItemChange(index, 'sellingPrice', e.target.value)}
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
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
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5" className="total-label">Total Amount:</td>
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
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : 'Create GRN'}
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