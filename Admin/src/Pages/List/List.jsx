import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './List.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const List = ({url}) => {
  const [list, setList] = useState([]);
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

  const removeItem = async (itemId) => {
    try {
      const response = await axios.post(`${url}/api/item/remove`, { item_id: itemId });
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
    }
  }

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
                    onClick={() => removeItem(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
    </div>
  )
}

export default List