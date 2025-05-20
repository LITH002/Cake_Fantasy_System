import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import BillGenerator from '../BillGenerator/BillGenerator';
import './OrderDetails.css';

const OrderDetails = ({ url }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useContext(AdminAuthContext);

  // Parse URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const showBillParam = queryParams.get('bill') === 'true';
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showBillGenerator, setShowBillGenerator] = useState(showBillParam);
  
  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fixed API endpoint to match your backend routes
        const response = await axios.get(
          `${url}/api/order/admin/${id}`,
          { 
            headers: { 
              Authorization: `Bearer ${token}` 
            }
          }
        );
        
        if (response.data.success) {
          setOrder(response.data.data);
        } else {
          setError("Failed to load order details");
          toast.error(response.data.message || "Failed to load order details");
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Error connecting to server");
        toast.error(err.response?.data?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id, token, url]);
  
  // Update order status
  const updateOrderStatus = async (status) => {
    try {
      setUpdatingStatus(true);
      
      // Fixed API endpoint to match your backend routes
      const response = await axios.post(
        `${url}/api/order/update-status`,
        { orderId: id, status },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data.success) {
        // Update order state
        setOrder(prev => ({ ...prev, status }));
        toast.success(`Order status updated to ${status}`);
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      toast.error(err.response?.data?.message || "Error updating order status");
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  // Update payment status
  const updatePaymentStatus = async (paymentStatus) => {
    try {
      setUpdatingStatus(true);
      
      // Fixed API endpoint to match your backend routes
      const response = await axios.post(
        `${url}/api/order/update-payment`,
        { orderId: id, payment: paymentStatus },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data.success) {
        // Update order state
        setOrder(prev => ({ ...prev, payment: paymentStatus }));
        toast.success(`Payment status updated to ${paymentStatus ? 'Paid' : 'Unpaid'}`);
      } else {
        toast.error(response.data.message || "Failed to update payment status");
      }
    } catch (err) {
      console.error("Error updating payment status:", err);
      toast.error(err.response?.data?.message || "Error updating payment status");
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusClass = (status) => {
    const statusLower = status.toLowerCase().replace(/\s+/g, '-');
    switch (statusLower) {
      case 'item-processing': return 'status-processing';
      case 'out-for-delivery': return 'status-delivering';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };
  
  if (loading) {
    return (
      <div className="order-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="order-details-error">
        <h3>Error Loading Order</h3>
        <p>{error || "Order not found"}</p>
        <button onClick={() => navigate('/orders')}>Back to Orders</button>
      </div>
    );
  }
  
  return (
    <div className="order-details-container">
      {showBillGenerator ? (
        <BillGenerator 
          orderData={order} 
          onClose={() => setShowBillGenerator(false)} 
        />
      ) : (
        <>
          <div className="order-details-header">
            <div className="order-details-title">
              <h2>Order #{order.id}</h2>
              <span className={`order-status ${getStatusClass(order.status)}`}>
                {order.status}
              </span>
            </div>
            
            <div className="order-actions">
              <button 
                className="generate-bill-btn"
                onClick={() => setShowBillGenerator(true)}
              >
                Generate Bill
              </button>
              <button 
                className="back-btn"
                onClick={() => navigate('/orders')}
              >
                Back to Orders
              </button>
            </div>
          </div>
          
          <div className="order-details-content">
            <div className="order-overview">
              <div className="order-info-card">
                <h3>Order Information</h3>
                <div className="info-row">
                  <span className="info-label">Order Date:</span>
                  <span className="info-value">{formatDate(order.created_at)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Payment Status:</span>
                  <span className={`info-value ${order.payment ? 'paid' : 'unpaid'}`}>
                    {order.payment ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Total Amount:</span>
                  <span className="info-value">LKR {parseFloat(order.amount).toFixed(2)}</span>
                </div>
                
                <div className="status-updates">
                  <div className="status-update-section">
                    <h4>Update Order Status</h4>
                    <div className="status-buttons">
                      <button 
                        className={`status-btn ${order.status === 'Item Processing' ? 'active' : ''}`}
                        onClick={() => updateOrderStatus('Item Processing')}
                        disabled={updatingStatus || order.status === 'Item Processing'}
                      >
                        Item Processing
                      </button>
                      <button 
                        className={`status-btn ${order.status === 'Out for Delivery' ? 'active' : ''}`}
                        onClick={() => updateOrderStatus('Out for Delivery')}
                        disabled={updatingStatus || order.status === 'Out for Delivery'}
                      >
                        Out for Delivery
                      </button>
                      <button 
                        className={`status-btn ${order.status === 'Delivered' ? 'active' : ''}`}
                        onClick={() => updateOrderStatus('Delivered')}
                        disabled={updatingStatus || order.status === 'Delivered'}
                      >
                        Delivered
                      </button>
                      <button 
                        className={`status-btn cancel-btn ${order.status === 'Cancelled' ? 'active' : ''}`}
                        onClick={() => updateOrderStatus('Cancelled')}
                        disabled={updatingStatus || order.status === 'Cancelled'}
                      >
                        Cancelled
                      </button>
                    </div>
                  </div>
                  
                  <div className="payment-update-section">
                    <h4>Update Payment Status</h4>
                    <div className="payment-buttons">
                      <button 
                        className={`payment-btn ${order.payment ? 'active' : ''}`}
                        onClick={() => updatePaymentStatus(true)}
                        disabled={updatingStatus || order.payment}
                      >
                        Mark as Paid
                      </button>
                      <button 
                        className={`payment-btn ${!order.payment ? 'active' : ''}`}
                        onClick={() => updatePaymentStatus(false)}
                        disabled={updatingStatus || !order.payment}
                      >
                        Mark as Unpaid
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="customer-info-card">
                <h3>Customer Information</h3>
                <div className="info-row">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{order.first_name} {order.last_name}</span>
                </div>
                {order.contact_number1 && (
                  <div className="info-row">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{order.contact_number1}</span>
                  </div>
                )}
                {order.email && (
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{order.email}</span>
                  </div>
                )}
                {order.address && (
                  <div className="info-row">
                    <span className="info-label">Address:</span>
                    <span className="info-value">{order.address}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="order-items-section">
              <h3>Order Items</h3>
              <div className="order-items-table-container">
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items && order.items.map((item, index) => (
                      <tr key={index}>
                        <td className="item-name-cell">
                          {item.image && <img src={item.image} alt={item.name} className="item-thumbnail" />}
                          <span>{item.name}</span>
                        </td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>LKR {parseFloat(item.price).toFixed(2)}</td>
                        <td>LKR {(parseFloat(item.price) * parseFloat(item.quantity)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="total-label">Subtotal:</td>
                      <td className="total-value">LKR {parseFloat(order.amount).toFixed(2)}</td>
                    </tr>
                    {order.delivery_fee && (
                      <tr>
                        <td colSpan="3" className="total-label">Delivery Fee:</td>
                        <td className="total-value">LKR {parseFloat(order.delivery_fee).toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="order-total">
                      <td colSpan="3" className="total-label">Total:</td>
                      <td className="total-value">
                        LKR {(parseFloat(order.amount) + (parseFloat(order.delivery_fee) || 0)).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {order.notes && (
              <div className="order-notes-section">
                <h3>Order Notes</h3>
                <div className="order-notes">{order.notes}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OrderDetails;