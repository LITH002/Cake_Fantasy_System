import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import ConfirmDialog from '../../Components/ConfirmDialog/ConfirmDialog';
import './Supplier.css';

const SupplierList = ({ url }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  
  const { token } = useContext(AdminAuthContext);
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddClick = () => {
    navigate('/add-supplier');
  };

  const handleEditClick = (supplierId) => {
    navigate(`/edit-supplier/${supplierId}`);
  };

  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    
    try {
      const response = await axios.post(
        `${url}/api/supplier/remove`,
        { supplier_id: supplierToDelete.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success("Supplier removed successfully");
        fetchSuppliers();
      } else {
        toast.error(response.data.message || "Failed to remove supplier");
      }
    } catch (err) {
      console.error("Error removing supplier:", err);
      toast.error(err.response?.data?.message || "Error removing supplier");
    } finally {
      setIsConfirmOpen(false);
      setSupplierToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsConfirmOpen(false);
    setSupplierToDelete(null);
  };

  if (loading) {
    return (
      <div className="suppliers-loading">
        <div className="loading-spinner"></div>
        <p>Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="suppliers-container">
      <div className="suppliers-header">
        <h1>Supplier Management</h1>
        <button 
          className="add-supplier-btn"
          onClick={handleAddClick}
        >
          Add New Supplier
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="no-suppliers-message">
          <p>No suppliers found. Click the button above to add your first supplier.</p>
        </div>
      ) : (
        <div className="suppliers-table-container">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td>{supplier.name}</td>
                  <td>{supplier.contact_person}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.address}</td>
                  <td className="action-buttons">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditClick(supplier.id)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteClick(supplier)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Confirm Deletion"
        message={supplierToDelete ? `Are you sure you want to delete supplier "${supplierToDelete.name}"? This may affect existing GRNs.` : ""}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
};

export default SupplierList;