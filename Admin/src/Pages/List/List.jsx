import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import './List.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog';
import { AdminAuthContext } from '../../context/AdminAuthContext';

const List = ({url}) => {
  const [list, setList] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { token, hasRole } = useContext(AdminAuthContext);

  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/item/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error("Failed to fetch items");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Error loading items");
    } finally {
      setLoading(false);
    }
  }

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
    fetchList();
  }, [fetchList]);

  return (
    <div className='list-container'>      <div className="list-header">
        <h2>Inventory Items</h2>
        <div className="list-actions">
          {hasRole('admin') && (
            <button className="add-new-btn" onClick={() => navigate('/add')}>
              Add New Item
            </button>
          )}
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
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading items...</p>
        </div>
      ) : (
        <div className="list-table">
          <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>SKU</b>
            <b>Price</b>
            <b>Stock</b>
            <b>Actions</b>
          </div>

          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              // Determine which price to display, prioritizing selling_price
              const displayPrice = item.selling_price || item.cost_price;
              
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
                  <p className="item-price">LKR {parseFloat(displayPrice).toFixed(2)}</p>
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
                    >
                      Barcode
                    </button>
                    {/* Only show delete button for admin and owner roles */}
                    {hasRole('admin') && (
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