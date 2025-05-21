import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './List.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { useCallback } from 'react';

const List = ({url}) => {
  const [list, setList] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token, hasRole } = useContext(AdminAuthContext);
  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching items from:", `${url}/api/item/list`);
      console.log("Auth token:", token ? "Token exists" : "No token");
      
      if (!token) {
        setError("Authentication token is missing. Please try logging in again.");
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${url}/api/item/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("API response received:", response.status);
      
      if (response.data.success) {
        setList(response.data.data);
        console.log("Items loaded:", response.data.data.length);
      } else {
        console.error("API error:", response.data);
        setError(response.data.message || "Failed to fetch items");
        toast.error("Failed to fetch items");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error loading items";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [token, url]);

  const handleDeleteClick = (itemId, itemName) => {
    setItemToDelete({ id: itemId, name: itemName });
    setIsConfirmOpen(true);
  };

  const cancelDelete = () => {
    setIsConfirmOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const response = await axios.post(`${url}/api/item/remove`, 
        { item_id: itemToDelete.id },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh the list after successful removal
        fetchList();
      } else {
        toast.error("Error removing item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error(error.response?.data?.message || "Failed to remove item");
    } finally {
      setIsConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEdit = (itemId) => {
    navigate(`/edit-item/${itemId}`);
  }

  const handleBarcode = (itemId) => {
    navigate(`/item-barcode/${itemId}`);
  }

  const handleBulkBarcode = () => {
    navigate('/bulk-barcode');
  }

  // Filter items based on search term
  const filteredItems = list.filter(item => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchTermLower) ||
      item.category.toLowerCase().includes(searchTermLower) ||
      (item.sku && item.sku.toLowerCase().includes(searchTermLower)) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchTermLower))
    );
  });
  
  useEffect(() => {
    console.log('List component mounted');
    console.log('User token exists:', !!token);
    console.log('User authentication status:', token ? 'Authenticated' : 'Not authenticated');
    fetchList();
  }, [fetchList, token]);

  return (
    <div className='list-container'>      <div className="list-header">
        <h2>Inventory Items</h2>
        <div className="list-actions">
          <button className="add-new-btn" onClick={() => navigate('/add')}>
  Add New Item
</button>
          <button className="bulk-barcode-btn" onClick={handleBulkBarcode}>
            Print Bulk Barcodes
          </button>
        </div>
      </div>

      <div className="list-search">
        <input 
          type="text" 
          placeholder="Search by name, category, SKU or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading items...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-message">
            <h3>Error Loading Inventory</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={fetchList}>Try Again</button>
          </div>
        </div>
      ) : (
        <div className="list-table"><div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>SKU</b>
            <b>Cost</b>
            <b>Price</b>
            {hasRole('admin') && <b>Profit</b>}
            <b>Stock</b>
            <b>Actions</b>
          </div>

          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              // Determine which price to display, prioritizing selling_price
              const costPrice = parseFloat(item.cost_price) || 0;
              const sellingPrice = parseFloat(item.selling_price) || 0;
              const profit = sellingPrice - costPrice;
              const profitMargin = costPrice > 0 ? (profit / sellingPrice * 100).toFixed(1) : 0;
              
              // Format the stock information based on loose/non-loose
              const stockDisplay = item.is_loose 
                ? `${parseFloat(item.stock_quantity).toFixed(1)} ${item.unit}`
                : Math.floor(item.stock_quantity);
                
              // Add reorder level indicator
              const isLowStock = parseFloat(item.stock_quantity) <= parseFloat(item.reorder_level);
                
              return (
                <div className="list-table-format" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <p className="item-name">
                    {item.name}
                    {item.weight_value && <span className="item-weight">({item.weight_value}{item.weight_unit})</span>}
                  </p>
                  <p className="item-category">{item.category}</p>
                  <p className="item-sku">{item.sku || 'No SKU'}</p>
                  <p className="item-cost">{hasRole('admin') ? `LKR ${costPrice.toFixed(2)}` : "-"}</p>
                  <p className="item-price">LKR {sellingPrice.toFixed(2)}</p>
                  {hasRole('admin') && (
                    <p className={`item-profit ${profit > 0 ? 'profit-positive' : 'profit-negative'}`}>
                      LKR {profit.toFixed(2)}
                      <span className="profit-margin">({profitMargin}%)</span>
                    </p>
                  )}
                  <p className={`item-stock ${isLowStock ? 'low-stock' : ''}`}>
                    {stockDisplay}
                    {isLowStock && <span className="reorder-indicator">Low</span>}
                  </p>                  <div className="action-buttons">
                    {hasRole('admin') && (
                      <button 
                        className="edit-btn" 
                        onClick={() => handleEdit(item.id)}
                      >
                        Edit
                      </button>
                    )}
                    <button 
                      className="barcode-btn" 
                      onClick={() => handleBarcode(item.id)}
                      title="Generate barcode"
                    >
                      Barcode
                    </button>
                    {/* Only show delete button for admin and owner roles */}
                    {hasRole('owner') && (
                      <button 
                        className="delete-btn" 
                        onClick={() => handleDeleteClick(item.id, item.name)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-items">
              {searchTerm ? `No items found matching "${searchTerm}"` : 'No items added yet'}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Confirm Deletion"
        message={itemToDelete ? `Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.` : ""}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}

export default List;