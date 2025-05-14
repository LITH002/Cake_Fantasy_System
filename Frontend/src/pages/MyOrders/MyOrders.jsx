import { useState, useEffect, useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import './MyOrders.css';

const MyOrders = () => {
  const { url, token, logout } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        setError("Please login to view your orders");
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${url}/api/order/user/orders`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Orders response:", response.data);

        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          setError(response.data.message || "Failed to load orders");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        if (err.response?.status === 401) {
          // Token is invalid, force logout
          logout();
        }
        setError(err.response?.data?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [url, token, logout]);

  const toggleOrderDetails = (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Item Processing':
        return 'status-processing';
      case 'Out for Delivery':
        return 'status-delivery';
      case 'Delivered':
        return 'status-delivered';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="my-orders-container loading">Loading your orders...</div>;
  }

  if (error) {
    return <div className="my-orders-container error-message">{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="my-orders-container no-orders">
        <h2>Your Orders</h2>
        <p>You have not placed any orders yet.</p>
        <a href="/" className="shop-now-btn">Shop Now</a>
      </div>
    );
  }

  return (
    <div className="my-orders-container">
      <h2>Your Orders</h2>
      
      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-card" key={order.id}>
            <div 
              className="order-header" 
              onClick={() => toggleOrderDetails(order.id)}
            >
              <div className="order-summary">
                <h3>Order #{order.id}</h3>
                <p className="order-date">{formatDate(order.created_at)}</p>
              </div>
              
              <div className="order-meta">
                <span className={`order-status ${getStatusClass(order.status)}`}>
                  {order.status}
                </span>
                <span className="order-amount">LKR {order.amount}</span>
                <span className={`payment-status ${order.payment ? 'paid' : 'unpaid'}`}>
                  {order.payment ? 'Paid' : 'Payment Pending'}
                </span>
              </div>
              
              <button className="toggle-details">
                {expandedOrderId === order.id ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            {expandedOrderId === order.id && (
              <div className="order-details">
                <div className="delivery-info">
                  <h4>Delivery Information</h4>
                  <p><strong>Name:</strong> {order.firstName} {order.lastName}</p>
                  <p><strong>Contact:</strong> {order.contactNumber1}</p>
                  {order.contactNumber2 && (
                    <p><strong>Alternative Contact:</strong> {order.contactNumber2}</p>
                  )}
                  <p><strong>Address:</strong> {order.address}</p>
                  {order.specialInstructions && (
                    <p><strong>Special Instructions:</strong> {order.specialInstructions}</p>
                  )}
                </div>
                
                <div className="items-list">
                  <h4>Items Ordered</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items && order.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>LKR {item.price}</td>
                          <td>{item.quantity}</td>
                          <td>LKR {(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="delivery-fee">
                        <td colSpan="3">Delivery Fee</td>
                        <td>LKR 150.00</td>
                      </tr>
                      <tr className="order-total">
                        <td colSpan="3"><strong>Total</strong></td>
                        <td><strong>LKR {order.amount}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;