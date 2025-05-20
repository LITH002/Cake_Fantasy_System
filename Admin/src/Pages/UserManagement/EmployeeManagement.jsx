import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import './EmployeeManagement.css';

const EmployeeManagement = ({ url }) => {
  const { token, hasRole } = useContext(AdminAuthContext);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('employee'); // 'employee' or 'admin'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, [token, url]);
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/admin/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setEmployees(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error(error.response?.data?.message || "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  }, [token, url]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast.error("All fields are required");
      return;
    }

    try {
      // Different endpoint based on role
      const endpoint = modalType === 'admin' ? 'admins' : 'employees';
      
      const response = await axios.post(`${url}/api/admin/${endpoint}`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success(`${modalType === 'admin' ? 'Admin' : 'Employee'} added successfully`);
        setShowModal(false);
        resetForm();
        // Refresh employee list
        fetchEmployees();
      } else {
        toast.error(response.data.message || "Failed to add user");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error(error.response?.data?.message || "Failed to add user");
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      const response = await axios.delete(`${url}/api/admin/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Employee deleted successfully");
        // Update employees list
        setEmployees(employees.filter(emp => emp.id !== id));
      } else {
        toast.error(response.data.message || "Failed to delete employee");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error(error.response?.data?.message || "Failed to delete employee");
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: ''
    });
  };

  // Check if user has permission to manage users
  if (!hasRole('owner')) {
    return (
      <div className="error-message">
        <h2>Access Denied</h2>
        <p>You do not have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="employee-management">
      <div className="page-header">
        <h1>User Management</h1>
        <div className="action-buttons">
          <button onClick={() => openModal('employee')} className="add-btn">Add Employee</button>
          <button onClick={() => openModal('admin')} className="add-btn admin-btn">Add Admin</button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="employee-list">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">No employees found</td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.username}</td>
                    <td>{emp.first_name} {emp.last_name}</td>
                    <td>{emp.email}</td>
                    <td><span className={`role-badge ${emp.role}`}>{emp.role}</span></td>
                    <td>{new Date(emp.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => deleteEmployee(emp.id)} 
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add {modalType === 'admin' ? 'Admin' : 'Employee'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Username</label>
                  <input 
                    type="text" 
                    name="username" 
                    value={formData.username} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  required 
                  minLength="8"
                />
                <small>Password must be at least 8 characters</small>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Add {modalType === 'admin' ? 'Admin' : 'Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
