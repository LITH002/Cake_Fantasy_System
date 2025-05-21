import React from 'react';
import { Link } from 'react-router-dom';

const TopProducts = ({ products = [] }) => {
  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <h2>Top Selling Products</h2>
        <div className="dashboard-section-actions">
          <Link to="/list">View All Products</Link>
        </div>
      </div>
      
      {products.length === 0 ? (
        <div className="dashboard-no-data">
          <p>No sales data available yet</p>
        </div>
      ) : (
        <div className="dashboard-top-products-grid">
          {products.map(product => (
            <div key={product.id} className="dashboard-product-card">
              <div className="dashboard-product-image">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="dashboard-product-info">
                <h3>{product.name}</h3>
                <p className="dashboard-product-category">{product.category}</p>
                <div className="dashboard-product-stats">
                  <div className="dashboard-stat">
                    <span className="dashboard-stat-label">Sold</span>
                    <span className="dashboard-stat-value">{product.quantity_sold} {product.unit}</span>
                  </div>
                  <div className="dashboard-stat">
                    <span className="dashboard-stat-label">Revenue</span>
                    <span className="dashboard-stat-value">LKR {parseFloat(product.total_revenue).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopProducts;