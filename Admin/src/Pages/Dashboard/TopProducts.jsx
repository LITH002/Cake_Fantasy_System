import React from 'react';
import { Link } from 'react-router-dom';

const TopProducts = ({ products = [] }) => {
  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Top Selling Products</h2>
        <Link to="/list">View All Products</Link>
      </div>
      
      {products.length === 0 ? (
        <div className="no-data">
          <p>No sales data available yet</p>
        </div>
      ) : (
        <div className="top-products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <div className="product-stats">
                  <div className="stat">
                    <span className="stat-label">Sold</span>
                    <span className="stat-value">{product.quantity_sold} {product.unit}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Revenue</span>
                    <span className="stat-value">LKR {parseFloat(product.total_revenue).toFixed(2)}</span>
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