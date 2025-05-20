import React from 'react';
import { Link } from 'react-router-dom';
import ReportDownloader from '../../Components/ReportDownloader/ReportDownloader';

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

  const prepareOrdersReportData = () => {
    return orders.map(order => ({
      id: order.id,
      customer: `${order.first_name} ${order.last_name}`,
      date: formatDate(order.created_at),
      amount: parseFloat(order.amount).toFixed(2),
      status: order.status,
      payment: order.payment ? 'Paid' : 'Unpaid'
    }));
  };

  return (
    <div className="dashboard-widget">
      <div className="dashboard-widget-header">
        <h2>Recent Orders</h2>
        <div className="dashboard-widget-actions">
          <ReportDownloader
            data={prepareOrdersReportData()}
            reportName="Recent_Orders_Report"
            pdfHeaders={[
              {key: 'id', label: 'Order #'},
              {key: 'customer', label: 'Customer'},
              {key: 'date', label: 'Date'},
              {key: 'amount', label: 'Amount (LKR)'},
              {key: 'status', label: 'Status'},
              {key: 'payment', label: 'Payment'}
            ]}
            csvHeaders={[
              {key: 'id', label: 'Order ID'},
              {key: 'customer', label: 'Customer'},
              {key: 'date', label: 'Date'},
              {key: 'amount', label: 'Amount (LKR)'},
              {key: 'status', label: 'Status'},
              {key: 'payment', label: 'Payment'}
            ]}
          />
          <Link to="/orders">View All</Link>
        </div>
      </div>
      
      <div className="dashboard-widget-content">
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
                  <th>Action</th>
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
                    <td>
                      <Link to={`/orders/${order.id}`} className="dashboard-action-link">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersWidget;