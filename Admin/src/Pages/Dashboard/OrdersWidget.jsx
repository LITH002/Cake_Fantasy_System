import React from 'react';
import { Link } from 'react-router-dom';

const OrdersWidget = ({ orders = [] }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Item Processing':
        return 'dashboard-status-processing';
      case 'Out for Delivery':
        return 'dashboard-status-delivery';
      case 'Delivered':
        return 'dashboard-status-delivered';
      case 'Cancelled':
        return 'dashboard-status-cancelled';
      default:
        return '';
    }
  };

  return (
    <div className="dashboard-widget">
      <div className="dashboard-widget-header">
        <h2>Recent Orders</h2>
        <Link to="/orders">View All</Link>
      </div>
      
      {orders.length === 0 ? (
        <div className="dashboard-no-data">
          <p>No recent orders found</p>
        </div>
      ) : (
        <div className="dashboard-widget-table">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.first_name} {order.last_name}</td>
                  <td>LKR {parseFloat(order.amount).toFixed(2)}</td>
                  <td>
                    <span className={`dashboard-status ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersWidget;