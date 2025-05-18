import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './List.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog';

const List = ({url}) => {
  const [list, setList] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const navigate = useNavigate();

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/item/list`);
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error("Failed to fetch items");
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Error loading items");
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
      const response = await axios.post(`${url}/api/item/remove`, { item_id: itemToDelete.id });
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

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className='list add flex-col'>
      <p>All Items List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Actions</b>
        </div>
        {list.map((item, index) => {
          return (
            <div key={index} className='list-table-format'>
              {/* Use the full Cloudinary URL stored in the database */}
              <img src={item.image} alt={item.name}/>
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>LKR {item.price}</p>
              <div className="action-buttons">
                <button 
                  className="edit-btn" 
                  onClick={() => handleEdit(item.id)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDeleteClick(item.id, item.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Confirm Deletion"
        message={itemToDelete ? `Are you sure you want to delete "${itemToDelete.name}"? This action cannot be undone.` : ""}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  )
}

export default List;