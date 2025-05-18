import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import GRNStatusBadge from '../../Components/GRNComponents/GRNStatusBadge';
import './GRNList.css';

const GRNList = ({ url }) => {
  const [grnList, setGRNList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    supplierId: '',
    dateRange: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { token } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGRNs();
    fetchSuppliers();
  }, [filters]);

  // In GRNList.jsx
// In GRNList.jsx
const fetchGRNs = async () => {
  try {
    setLoading(true);
    
    // Build query string properly
    let queryString = '';
    if (filters.status || filters.supplierId || filters.startDate || filters.endDate || pagination.page) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.supplierId) params.append('supplier_id', filters.supplierId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', pagination.page || 1);
      params.append('limit', pagination.limit || 10);
      queryString = `?${params.toString()}`;
    }
    
    console.log(`Fetching GRNs from: ${url}/api/grn/list${queryString}`);
    
    const response = await axios.get(
      `${url}/api/grn/list${queryString}`,
      { 
        headers: { 
          Authorization: `Bearer ${token}` 
        } 
      }
    );
    
    console.log("GRN list response:", response.data);
    
    if (response.data.success) {
      setGRNList(response.data.data || []);
      
      // Handle pagination data if it exists
      if (response.data.pagination) {
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      }
    } else {
      toast.error(response.data.message || "Failed to fetch GRNs");
    }
  } catch (err) {
    console.error("Error fetching GRNs:", err);
    
    // Better error handling
    if (err.response) {
      console.error("Response error:", err.response.data);
      toast.error(err.response.data?.message || "Error loading GRN list");
    } else if (err.request) {
      console.error("Request error - no response received");
      toast.error("No response from server. Please check your connection");
    } else {
      console.error("Request setup error:", err.message);
      toast.error(`Error: ${err.message}`);
    }
  } finally {
    setLoading(false);
  }
};

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(
        `${url}/api/supplier/list`,
        { 
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setSuppliers(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
      page: 1 // Reset to first page when filters change
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setFilters({
      ...filters,
      page: newPage
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleViewGRN = (grnId) => {
    navigate(`/grn/${grnId}`);
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown';
  };
  
  // Filter GRNs by search term (reference number or supplier name)
  const filteredGRNs = searchTerm
    ? grnList.filter(grn => 
        grn.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSupplierName(grn.supplier_id).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : grnList;

  return (
    <div className="grn-container">
      <div className="grn-header">
        <h1>Goods Received Notes</h1>
        <button 
          className="create-grn-btn" 
          onClick={() => navigate('/create-grn')}
        >
          Create New GRN
        </button>
      </div>

      <div className="grn-filters">
        <div className="filter-group">
          <p>Status</p>
          <select 
            name="status" 
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        
        <div className="filter-group">
          <p>Supplier</p>
          <select 
            name="supplierId" 
            value={filters.supplierId}
            onChange={handleFilterChange}
          >
            <option value="">All Suppliers</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by reference number or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading GRNs...</p>
        </div>
      ) : filteredGRNs.length === 0 ? (
        <div className="no-grns">
          <p>No GRNs found</p>
        </div>
      ) : (
        <div className="grn-table-container">
          <table className="grn-table">
            <thead>
              <tr>
                <th>Reference #</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGRNs.map(grn => (
                <tr key={grn.id}>
                  <td className="grn-reference">{grn.reference_number}</td>
                  <td>{getSupplierName(grn.supplier_id)}</td>
                  <td>{formatDate(grn.created_at)}</td>
                  <td>{grn.item_count}</td>
                  <td className="grn-amount">
                    LKR {typeof grn.total_amount === 'number' 
                      ? grn.total_amount.toFixed(2) 
                      : parseFloat(grn.total_amount || 0).toFixed(2)}
                  </td>
                  <td>
                    <GRNStatusBadge status={grn.status} />
                  </td>
                  <td>
                    <button 
                      className="view-btn"
                      onClick={() => handleViewGRN(grn.id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          
          <button 
            className="pagination-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default GRNList;