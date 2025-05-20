import React, { useState, useEffect, useContext } from 'react';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReportDownloader from '../../Components/ReportDownloader/ReportDownloader';
import './Reports.css';

const Reports = ({ url }) => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('week');
  const [reportData, setReportData] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [reportSummary, setReportSummary] = useState({});
  const { token } = useContext(AdminAuthContext);
  
  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);
  
  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${url}/api/admin/reports/${reportType}?range=${dateRange}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setReportData(response.data.data || []);
        setCategorySales(response.data.categorySales || []);
        setReportSummary(response.data.summary || {});
      } else {
        toast.error("Failed to load report data");
      }
    } catch (err) {
      console.error("Error fetching report:", err);
      toast.error(err.response?.data?.message || "Error loading report");
    } finally {
      setLoading(false);
    }
  };
  
  const getReportConfig = () => {
    switch(reportType) {
      case 'sales':
        return {
          title: 'Sales',
          description: 'Overview of sales performance, revenue and profitability',
          pdfHeaders: [
            {key: 'date', label: 'Date'},
            {key: 'orders', label: 'Orders'},
            {key: 'revenue', label: 'Revenue (LKR)', isCurrency: true},
            {key: 'total_cost', label: 'Cost (LKR)', isCurrency: true},
            {key: 'profit', label: 'Profit (LKR)', isCurrency: true},
            {key: 'profit_margin', label: 'Margin (%)', isPercentage: true}
          ],
          csvHeaders: [
            {key: 'date', label: 'Date'},
            {key: 'orders', label: 'Orders'},
            {key: 'revenue', label: 'Revenue (LKR)'},
            {key: 'total_cost', label: 'Cost (LKR)'},
            {key: 'profit', label: 'Profit (LKR)'},
            {key: 'profit_margin', label: 'Profit Margin (%)'}
          ],
          categoryPdfHeaders: [
            {key: 'category', label: 'Category'},
            {key: 'order_count', label: 'Orders'},
            {key: 'quantity_sold', label: 'Qty Sold'},
            {key: 'revenue', label: 'Revenue (LKR)', isCurrency: true},
            {key: 'cost', label: 'Cost (LKR)', isCurrency: true},
            {key: 'profit', label: 'Profit (LKR)', isCurrency: true},
            {key: 'profit_margin', label: 'Margin (%)', isPercentage: true}
          ],
          categoryCsvHeaders: [
            {key: 'category', label: 'Category'},
            {key: 'order_count', label: 'Orders'},
            {key: 'quantity_sold', label: 'Quantity Sold'},
            {key: 'revenue', label: 'Revenue (LKR)'},
            {key: 'cost', label: 'Cost (LKR)'},
            {key: 'profit', label: 'Profit (LKR)'},
            {key: 'profit_margin', label: 'Profit Margin (%)'}
          ]
        };
      case 'inventory':
        return {
          title: 'Inventory Status',
          description: 'Current inventory levels and status',
          pdfHeaders: [
            {key: 'name', label: 'Item Name'},
            {key: 'category', label: 'Category'},
            {key: 'stock_quantity', label: 'Stock'},
            {key: 'unit', label: 'Unit'},
            {key: 'reorder_level', label: 'Reorder Level'},
            {key: 'selling_price', label: 'Price (LKR)', isCurrency: true},
            {key: 'profit_per_unit', label: 'Profit/Unit (LKR)', isCurrency: true},
            {key: 'status', label: 'Status'}
          ],
          csvHeaders: [
            {key: 'id', label: 'ID'},
            {key: 'name', label: 'Item Name'},
            {key: 'category', label: 'Category'},
            {key: 'stock_quantity', label: 'Stock Quantity'},
            {key: 'unit', label: 'Unit'},
            {key: 'reorder_level', label: 'Reorder Level'},
            {key: 'cost_price', label: 'Cost Price (LKR)'},
            {key: 'selling_price', label: 'Selling Price (LKR)'},
            {key: 'profit_per_unit', label: 'Profit Per Unit (LKR)'},
            {key: 'profit_margin', label: 'Profit Margin (%)'},
            {key: 'status', label: 'Status'}
          ]
        };
      case 'products':
        return {
          title: 'Product Performance',
          description: 'Analysis of best-selling products',
          pdfHeaders: [
            {key: 'name', label: 'Product Name'},
            {key: 'category', label: 'Category'},
            {key: 'quantity_sold', label: 'Qty Sold'},
            {key: 'unit', label: 'Unit'},
            {key: 'total_revenue', label: 'Revenue (LKR)', isCurrency: true},
            {key: 'total_profit', label: 'Profit (LKR)', isCurrency: true},
            {key: 'profit_margin', label: 'Margin (%)', isPercentage: true}
          ],
          csvHeaders: [
            {key: 'id', label: 'ID'},
            {key: 'name', label: 'Product Name'},
            {key: 'category', label: 'Category'},
            {key: 'quantity_sold', label: 'Quantity Sold'},
            {key: 'unit', label: 'Unit'},
            {key: 'total_revenue', label: 'Revenue (LKR)'},
            {key: 'total_cost', label: 'Cost (LKR)'},
            {key: 'total_profit', label: 'Profit (LKR)'},
            {key: 'profit_margin', label: 'Profit Margin (%)'}
          ],
          categoryPdfHeaders: [
            {key: 'category', label: 'Category'},
            {key: 'quantity_sold', label: 'Qty Sold'},
            {key: 'total_revenue', label: 'Revenue (LKR)', isCurrency: true},
            {key: 'total_profit', label: 'Profit (LKR)', isCurrency: true},
            {key: 'profit_margin', label: 'Margin (%)', isPercentage: true}
          ],
          categoryCsvHeaders: [
            {key: 'category', label: 'Category'},
            {key: 'quantity_sold', label: 'Quantity Sold'},
            {key: 'total_revenue', label: 'Revenue (LKR)'},
            {key: 'total_profit', label: 'Profit (LKR)'},
            {key: 'profit_margin', label: 'Profit Margin (%)'}
          ]
        };
      default:
        return {
          title: 'Report',
          description: '',
          pdfHeaders: [],
          csvHeaders: []
        };
    }
  };
  
  const config = getReportConfig();
  
  const renderReportTable = () => {
    if (loading) {
      return (
        <div className="report-loading">
          <div className="loading-spinner"></div>
          <p>Loading report data...</p>
        </div>
      );
    }
    
    if (!reportData.length) {
      return <p className="no-report-data">No data available for this report</p>;
    }
    
    return (
      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              {config.pdfHeaders.map((header, index) => (
                <th key={index}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reportData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {reportType === 'sales' && (
                  <>
                    <td>{row.date}</td>
                    <td>{row.orders}</td>
                    <td>LKR {parseFloat(row.revenue).toFixed(2)}</td>
                    <td>LKR {parseFloat(row.total_cost).toFixed(2)}</td>
                    <td>LKR {parseFloat(row.profit).toFixed(2)}</td>
                    <td>{parseFloat(row.profit_margin).toFixed(2)}%</td>
                  </>
                )}
                
                {reportType === 'inventory' && (
                  <>
                    <td>{row.name}</td>
                    <td>{row.category}</td>
                    <td>{row.stock_quantity} {row.unit}</td>
                    <td>{row.unit}</td>
                    <td>{row.reorder_level}</td>
                    <td>LKR {parseFloat(row.selling_price).toFixed(2)}</td>
                    <td>LKR {parseFloat(row.profit_per_unit).toFixed(2)}</td>
                    <td>
                      <span className={`report-status ${row.stock_quantity === 0 ? 'status-out' : 'status-low'}`}>
                        {row.status}
                      </span>
                    </td>
                  </>
                )}
                
                {reportType === 'products' && (
                  <>
                    <td>{row.name}</td>
                    <td>{row.category}</td>
                    <td>{row.quantity_sold}</td>
                    <td>{row.unit}</td>
                    <td>LKR {parseFloat(row.total_revenue).toFixed(2)}</td>
                    <td>LKR {parseFloat(row.total_profit).toFixed(2)}</td>
                    <td>{parseFloat(row.profit_margin).toFixed(2)}%</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  const renderCategorySales = () => {
    if (!categorySales.length) {
      return null;
    }
    
    return (
      <div className="category-sales-section">
        <div className="category-header">
          <h3>Sales by Category</h3>
          <ReportDownloader
            data={categorySales}
            reportName={`${config.title}_By_Category`}
            pdfHeaders={config.categoryPdfHeaders}
            csvHeaders={config.categoryCsvHeaders}
            reportSummary={reportSummary}
          />
        </div>
        
        <div className="report-table-container">
          <table className="report-table">
            <thead>
              <tr>
                {(reportType === 'sales' ? config.categoryPdfHeaders : config.categoryPdfHeaders).map((header, index) => (
                  <th key={index}>{header.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categorySales.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {reportType === 'sales' && (
                    <>
                      <td>{row.category}</td>
                      <td>{row.order_count}</td>
                      <td>{row.quantity_sold}</td>
                      <td>LKR {parseFloat(row.revenue).toFixed(2)}</td>
                      <td>LKR {parseFloat(row.cost).toFixed(2)}</td>
                      <td>LKR {parseFloat(row.profit).toFixed(2)}</td>
                      <td>{parseFloat(row.profit_margin).toFixed(2)}%</td>
                    </>
                  )}
                  
                  {reportType === 'products' && (
                    <>
                      <td>{row.category}</td>
                      <td>{row.quantity_sold}</td>
                      <td>LKR {parseFloat(row.total_revenue).toFixed(2)}</td>
                      <td>LKR {parseFloat(row.total_profit).toFixed(2)}</td>
                      <td>{parseFloat(row.profit_margin).toFixed(2)}%</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Reports</h1>
        {reportData.length > 0 && (
          <ReportDownloader
            data={reportData}
            reportName={config.title}
            pdfHeaders={config.pdfHeaders}
            csvHeaders={config.csvHeaders}
            reportSummary={reportSummary}
          />
        )}
      </div>
      
      <div className="report-controls">
        <div className="report-type-selector">
          <label>Report Type:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Status</option>
            <option value="products">Product Performance</option>
          </select>
        </div>
        
        <div className="report-date-range">
          <label>Time Period:</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>
      
      <div className="report-content">
        <div className="report-header">
          <h2>{config.title} Report</h2>
          <p>{config.description}</p>
        </div>
        
        {Object.keys(reportSummary).length > 0 && (
          <div className="report-summary">
            <h3>Report Summary</h3>
            <div className="summary-grid">
              {Object.entries(reportSummary).map(([key, value], index) => (
                <div key={index} className="summary-item">
                  <span className="summary-label">{key}:</span>
                  <span className="summary-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {renderReportTable()}
        
        {(reportType === 'sales' || reportType === 'products') && categorySales.length > 0 && (
          renderCategorySales()
        )}
      </div>
    </div>
  );
};

export default Reports;