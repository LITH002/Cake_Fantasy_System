import React from 'react';
import { Link } from 'react-router-dom';

const InventoryWidget = ({ items = [] }) => {
  return (
    <div className="dashboard-widget">
      <div className="dashboard-widget-header">
        <h2>Low Stock Items</h2>
        <Link to="/list">View All</Link>
      </div>
      
      {items.length === 0 ? (
        <div className="dashboard-no-data">
          <p>No low stock items found</p>
        </div>
      ) : (
        <div className="dashboard-widget-table">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="dashboard-item-cell">
                    <img src={item.image} alt={item.name} className="dashboard-item-thumbnail" />
                    <span>{item.name}</span>
                  </td>
                  <td>
                    {item.stock_quantity} {item.unit}
                  </td>
                  <td>
                    <span className={`dashboard-status ${item.stock_quantity === 0 ? 'dashboard-status-out' : 'dashboard-status-low'}`}>
                      {item.stock_quantity === 0 ? 'Out of Stock' : 'Low Stock'}
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

export default InventoryWidget;