import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';
import SalesChart from './SalesChart';
import InventoryWidget from './InventoryWidget';
import OrdersWidget from './OrdersWidget';
import TopProducts from './TopProducts';
import './Dashboard.css';
import assets from '../../assets/assets';

const Dashboard = ({ url }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  const { token } = useContext(AdminAuthContext);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching dashboard data with URL: ${url}/api/admin/dashboard?range=${timeRange}`);
      console.log(`Using token: ${token}`);

      const response = await axios.get(`${url}/api/admin/dashboard?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Dashboard API response:", response.data);

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        console.error("Failed response:", response.data);
        toast.error(response.data.message || "Failed to load dashboard data");
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Error connecting to server");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={fetchDashboardData}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-timerange">
          <button
            className={timeRange === 'week' ? 'active' : ''}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
          <button
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
          <button
            className={timeRange === 'year' ? 'active' : ''}
            onClick={() => setTimeRange('year')}
          >
            This Year
          </button>
        </div>
      </div>

      <div className="dashboard-summary">
        <div className="dashboard-summary-card revenue">
          <div className="dashboard-summary-icon"><img src={assets.rupee_icon} alt=""/></div>
          <div className="dashboard-summary-content">
            <h3>Total Revenue</h3>
            <p>LKR {dashboardData?.totalRevenue?.toFixed(2) || "0.00"}</p>
            <span className={dashboardData?.revenueChange >= 0 ? "positive" : "negative"}>
              {dashboardData?.revenueChange >= 0 ? "↑" : "↓"} {Math.abs(dashboardData?.revenueChange || 0).toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="dashboard-summary-card orders">
          <div className="dashboard-summary-icon"><img src={assets.basket_icon} alt="" /></div>
          <div className="dashboard-summary-content">
            <h3>Orders</h3>
            <p>{dashboardData?.totalOrders || 0}</p>
            <span className="orders-processing">
              {dashboardData?.processingOrders || 0} Processing
            </span>
          </div>
        </div>
        
        <div className="dashboard-summary-card inventory">
          <div className="dashboard-summary-icon"><img src={assets.out_of_stock} alt="" /></div>
          <div className="dashboard-summary-content">
            <h3>Inventory</h3>
            <p>{dashboardData?.lowStockItems?.length || 0} Items Low</p>
            <span className="out-of-stock">
              {dashboardData?.outOfStockItems?.length || 0} Out of Stock
            </span>
          </div>
        </div>
        
        <div className="dashboard-summary-card avg-order">
          <div className="dashboard-summary-icon"><img src={assets.avg_icon} alt="" /></div>
          <div className="dashboard-summary-content">
            <h3>Avg. Order Value</h3>
            <p>LKR {dashboardData?.averageOrderValue?.toFixed(2) || "0.00"}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="dashboard-chart-container">
          <div className="dashboard-chart-header">
            <h2>Revenue Trends</h2>
            <Link to="/reports/sales">View Details</Link>
          </div>
          <SalesChart data={dashboardData?.salesData || []} />
        </div>
      </div>

      <div className="dashboard-widgets">
        <OrdersWidget orders={dashboardData?.recentOrders || []} />
        <InventoryWidget items={dashboardData?.lowStockItems || []} />
      </div>

      <div className="dashboard-products">
        <TopProducts products={dashboardData?.topProducts || []} />
      </div>
    </div>
  );
};

export default Dashboard;