import React, { useState, useEffect, useContext } from 'react';
import "./Orders.css";
import { toast } from "react-toastify";
import axios from 'axios';
import { AdminAuthContext } from '../../context/AdminAuthContext';
//import assets from '../../assets/assets';

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const { token } = useContext(AdminAuthContext);
  const [filters, setFilters] = useState({
    status: '',
    payment: '',
    page: 1
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.payment !== '') queryParams.append('payment', filters.payment);
      queryParams.append('page', filters.page);
      queryParams.append('limit', 10);
      
      const response = await axios.get(
        `${url}/api/order/admin/list?${queryParams.toString()}`,
        { 
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Orders API response:', response.data);
      
      if (response.data.success) {
        setOrders(response.data.data);
        setPagination(response.data.pagination);
      } else {
        toast.error("Failed to load orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      toast.error(err.response?.data?.message || "Error loading orders");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await axios.post(
        `${url}/api/order/update-status`,
        { orderId, status },
        { 
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success(`Order #${orderId} status updated to ${status}`);
        fetchOrders(); // Refresh orders
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      toast.error(err.response?.data?.message || "Error updating order status");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

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

  const toggleOrderDetails = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  return (
    <div className="orders add flex-col">
      <p>Order Management</p>
      
      <div className="orders-filters">
        <div className="filter-group flex-col">
          <p>Order Status</p>
          <select 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="Item Processing">Item Processing</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="filter-group flex-col">
          <p>Payment Status</p>
          <select 
            name="payment" 
            value={filters.payment} 
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            <option value="true">Paid</option>
            <option value="false">Unpaid</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found</p>
        </div>
      ) : (
        <>
          <div className="list-table">
            <div className="list-table-format title">
              <b>Order #</b>
              <b>Customer</b>
              <b>Date</b>
              <b>Items</b>
              <b>Amount</b>
              <b>Status</b>
              <b>Payment</b>
              <b>Actions</b>
            </div>
            
            {orders.map(order => (
              <div key={order.id} className="order-container">
                <div className="list-table-format">
                  <p>#{order.id}</p>
                  <p>{order.first_name} {order.last_name}</p>
                  <p>{formatDate(order.created_at)}</p>
                  <p>{order.total_items || 0} items</p>
                  <p>LKR {order.amount}</p>
                  <p className={`status ${getStatusClass(order.status)}`}>
                    {order.status}
                  </p>
                  <p className={`payment ${order.payment ? 'paid' : 'unpaid'}`}>
                    {order.payment ? 'Paid' : 'Unpaid'}
                  </p>
                  <div className="action-buttons">
                    <button 
                      className="view-btn"
                      onClick={() => toggleOrderDetails(order.id)}
                    >
                      {expandedOrderId === order.id ? 'Hide' : 'View'}
                    </button>
                  </div>
                </div>

                {expandedOrderId === order.id && (
                  <div className="order-details">
                    <div className="details-section">
                      <h3>Customer Details</h3>
                      <p><strong>Name:</strong> {order.first_name} {order.last_name}</p>
                      <p><strong>Contact:</strong> {order.contact_number1}</p>
                      <p><strong>Username:</strong> {order.username || 'N/A'}</p>
                    </div>

                    <div className="details-section">
                      <h3>Update Status</h3>
                      <div className="status-update">
                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              updateOrderStatus(order.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Change Status</option>
                          <option value="Item Processing">Item Processing</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="pagination">
            <button 
              onClick={() => handlePageChange(1)} 
              disabled={pagination.page === 1}
              className="pagination-btn"
            >
              First
            </button>
            <button 
              onClick={() => handlePageChange(pagination.page - 1)} 
              disabled={pagination.page === 1}
              className="pagination-btn"
            >
              Prev
            </button>
            <span className="page-info">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <button 
              onClick={() => handlePageChange(pagination.page + 1)} 
              disabled={pagination.page === pagination.totalPages}
              className="pagination-btn"
            >
              Next
            </button>
            <button 
              onClick={() => handlePageChange(pagination.totalPages)} 
              disabled={pagination.page === pagination.totalPages}
              className="pagination-btn"
            >
              Last
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Orders;