import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import BarcodeGenerator from '../../Components/BarcodeGenerator/BarcodeGenerator';
import './ItemBarcode.css';

const ItemBarcode = ({ url }) => {
  const { itemId } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copies, setCopies] = useState(1);
  const { token } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItemDetails();
  }, [itemId]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${url}/api/item/barcode/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setItem(response.data.data);
      } else {
        setError("Failed to fetch item details");
        toast.error("Could not retrieve item data");
      }
    } catch (err) {
      console.error("Error fetching item for barcode:", err);
      setError(err.response?.data?.message || "Error loading item data");
      toast.error(err.response?.data?.message || "Error loading item data");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintMultiple = () => {
    if (!item) return;
    
    const barcodeValue = item.barcode || item.sku;
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes - ${item.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .barcode-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
              padding: 10px;
            }
            .barcode-print-container {
              width: 150px;
              padding: 5px;
              border: 1px dashed #ddd;
              margin: 0 auto;
              text-align: center;
              page-break-inside: avoid;
            }
            .barcode-name {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 140px;
            }
            .barcode-sku {
              font-size: 8px;
              color: #666;
              margin-bottom: 2px;
            }
            .barcode-image {
              width: 100%;
              max-width: 140px;
            }
            .barcode-price {
              font-size: 12px;
              font-weight: bold;
              margin-top: 2px;
            }
            .page-break {
              page-break-after: always;
            }
            @media print {
              .barcode-grid {
                grid-template-columns: repeat(3, 1fr);
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-grid">
    `);
    
    // Generate canvas with JsBarcode
    const canvas = document.createElement('canvas');
    try {
      window.JsBarcode(canvas, barcodeValue, {
        format: "CODE128",
        width: 1.5,
        height: 40,
        displayValue: true,
        fontSize: 8,
        margin: 5,
        background: "#ffffff"
      });
    } catch (err) {
      console.error("Error generating barcode for printing:", err);
    }
    
    // Add multiple copies
    for (let i = 0; i < copies; i++) {
      printWindow.document.write(`
        <div class="barcode-print-container">
          <div class="barcode-name">${item.name}</div>
          <div class="barcode-sku">SKU: ${item.sku}</div>
          <img src="${canvas.toDataURL('image/png')}" class="barcode-image" />
          <div class="barcode-price">LKR ${parseFloat(item.selling_price).toFixed(2)}</div>
        </div>
      `);
      
      // Add page break every 24 items
      if ((i + 1) % 24 === 0 && i !== copies - 1) {
        printWindow.document.write('<div class="page-break"></div>');
      }
    }
    
    printWindow.document.write(`
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="item-barcode-loading">
        <div className="loading-spinner"></div>
        <p>Loading item data...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="item-barcode-error">
        <div>⚠️ {error || "Could not load item"}</div>
        <button 
          className="back-btn"
          onClick={() => navigate('/list')}
        >
          Back to Items
        </button>
      </div>
    );
  }

  return (
    <div className="item-barcode-container">
      <div className="barcode-header">
        <h2>Barcode Generator: {item.name}</h2>
        <button 
          className="back-btn"
          onClick={() => navigate('/list')}
        >
          Back to Items
        </button>
      </div>

      <div className="barcode-content-container">
        <div className="barcode-details">
          <p><strong>Item Name:</strong> {item.name}</p>
          <p><strong>SKU:</strong> {item.sku}</p>
          <p><strong>Barcode Value:</strong> {item.barcode || item.sku}</p>
          <p><strong>Category:</strong> {item.category}</p>
          <p><strong>Price:</strong> LKR {parseFloat(item.selling_price).toFixed(2)}</p>
        </div>

        <div className="barcode-preview">
          <BarcodeGenerator 
            value={item.barcode || item.sku}
            name={item.name}
            price={item.selling_price}
            sku={item.sku}
          />
        </div>

        <div className="bulk-print-options">
          <h3>Print Multiple Copies</h3>
          <div className="copies-selector">
            <label htmlFor="copies">Number of copies:</label>
            <input 
              type="number" 
              id="copies" 
              min="1" 
              max="100"
              value={copies}
              onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
            />
          </div>
          <button 
            className="print-multiple-btn"
            onClick={handlePrintMultiple}
          >
            Print {copies} {copies === 1 ? 'Copy' : 'Copies'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemBarcode;