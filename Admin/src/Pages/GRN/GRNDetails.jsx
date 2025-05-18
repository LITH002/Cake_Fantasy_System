import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import GRNStatusBadge from '../../Components/GRNComponents/GRNStatusBadge';
import './GRNDetails.css';

const GRNDetails = ({ url }) => {
  const { grnId } = useParams();
  const [grn, setGRN] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { token, hasRole } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGRNDetails();
  }, [grnId]);

  const fetchGRNDetails = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${url}/api/grn/${grnId}`,
        { 
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setGRN(response.data.data);
        
        // Fetch supplier details
        if (response.data.data.supplier_id) {
          fetchSupplierDetails(response.data.data.supplier_id);
        }
      } else {
        toast.error("Failed to load GRN details");
      }
    } catch (err) {
      console.error("Error fetching GRN details:", err);
      toast.error(err.response?.data?.message || "Error loading GRN details");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierDetails = async (supplierId) => {
    try {
      const response = await axios.get(
        `${url}/api/supplier/${supplierId}`,
        { 
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setSupplier(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching supplier details:", err);
    }
  };

  const updateGRNStatus = async (status) => {
  try {
    setActionLoading(true);
    
    console.log(`Updating GRN ${grnId} status to ${status}`);
    
    const response = await axios.post(
      `${url}/api/grn/${grnId}/update-status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log("Update status response:", response.data);
    
    if (response.data.success) {
      // Immediately update the local state to reflect the new status
      setGRN(prevState => ({
        ...prevState,
        status: status
      }));
      
      toast.success(`GRN ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      
      // Then refetch the full details for completeness
      fetchGRNDetails();
    } else {
      toast.error(response.data.message || "Failed to update GRN status");
    }
  } catch (err) {
    console.error("Error updating GRN status:", err);
    
    if (err.response) {
      console.error("Response error:", err.response.data);
      toast.error(err.response.data?.message || "Error updating GRN status");
    } else if (err.request) {
      console.error("No response received");
      toast.error("No response from server. Check your connection.");
    } else {
      console.error("Request error:", err.message);
      toast.error(`Error: ${err.message}`);
    }
  } finally {
    setActionLoading(false);
  }
};

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateItemTotal = (item) => {
    const quantity = item.quantity || item.received_quantity || 0;
    const price = parseFloat(item.unit_price || 0);
    return (quantity * price).toFixed(2);
  };

  if (loading) {
    return (
      <div className="grn-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading GRN details...</p>
        <small>Please wait while we retrieve the information</small>
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="grn-details-error">
        <div className="error-icon">⚠️</div>
        <p>GRN not found or you don't have permission to view it.</p>
        <button 
          className="back-button"
          onClick={() => navigate('/grn')}
        >
          Back to GRN List
        </button>
      </div>
    );
  }

  return (
    <div className="grn-details-container">
      <div className="grn-details-header">
        <div>
          <h1>GRN Details: {grn.reference_number}</h1>
          <GRNStatusBadge status={grn.status} />
        </div>
        <button 
          className="back-button"
          onClick={() => navigate('/grn')}
        >
          Back to GRN List
        </button>
      </div>

      <div className="grn-details-content">
        <div className="grn-info-section">
          <h3>General Information</h3>
          <div className="grn-info-grid">
            <div className="info-item">
              <span className="info-label">Reference Number:</span>
              <span className="info-value">{grn.reference_number}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className="info-value"><GRNStatusBadge status={grn.status} /></span>
            </div>
            <div className="info-item">
              <span className="info-label">Created Date:</span>
              <span className="info-value">{formatDate(grn.created_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Created By:</span>
              <span className="info-value">{grn.created_by_name || 'Unknown'}</span>
            </div>
            {grn.status !== 'pending' && (
              <>
                <div className="info-item">
                  <span className="info-label">Updated Date:</span>
                  <span className="info-value">{formatDate(grn.updated_at)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Updated By:</span>
                  <span className="info-value">{grn.updated_by_name || 'Unknown'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grn-supplier-section">
          <h3>Supplier Information</h3>
          {supplier ? (
            <div className="grn-info-grid">
              <div className="info-item">
                <span className="info-label">Supplier Name:</span>
                <span className="info-value">{supplier.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Contact Person:</span>
                <span className="info-value">{supplier.contact_person || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{supplier.email || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{supplier.phone || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Address:</span>
                <span className="info-value">{supplier.address || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <p className="no-data-message">Supplier information not available</p>
          )}
        </div>

        <div className="grn-items-section">
          <h3>Received Items</h3>
          <div className="table-container">
            <table className="grn-items-table">
              <thead>
                <tr>
                  <th className="item-name-col">Item Name</th>
                  <th className="quantity-col">Quantity</th>
                  <th className="price-col">Unit Price</th>
                  <th className="total-col">Total</th>
                </tr>
              </thead>
              <tbody>
                {(grn.items || []).length > 0 ? (
                  grn.items.map((item, index) => (
                    <tr key={index}>
                      <td className="item-name-col">{item.name || 'Unknown'}</td>
                      <td className="quantity-col">{item.quantity || item.received_quantity || 0}</td>
                      <td className="price-col">LKR {parseFloat(item.unit_price || 0).toFixed(2)}</td>
                      <td className="total-col">LKR {calculateItemTotal(item)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-items">No items found in this GRN</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="total-label">Total Amount:</td>
                  <td className="total-value">LKR {parseFloat(grn.total_amount || 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="grn-notes-section">
          <h3>Notes</h3>
          {grn.notes ? (
            <p className="notes-content">{grn.notes}</p>
          ) : (
            <p className="no-notes">No additional notes for this GRN</p>
          )}
        </div>

        {grn.status === 'pending' && hasRole('owner') && (
          <div className="grn-actions">
            <button 
              className="approve-btn"
              onClick={() => updateGRNStatus('approved')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <span className="button-spinner"></span>
                  Processing...
                </>
              ) : (
                'Approve GRN'
              )}
            </button>
            <button 
              className="reject-btn"
              onClick={() => updateGRNStatus('rejected')}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <span className="button-spinner"></span>
                  Processing...
                </>
              ) : (
                'Reject GRN'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GRNDetails;