import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import './BulkBarcodePrint.css';

const BulkBarcodePrint = ({ url }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copies, setCopies] = useState(1);
  const { token } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `${url}/api/item/list`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Filter out items without selling price
        const itemsWithPrice = response.data.data.filter(item => 
          item.selling_price && parseFloat(item.selling_price) > 0
        );
        setItems(itemsWithPrice);
      } else {
        toast.error("Failed to fetch items");
      }
    } catch (err) {
      console.error("Error fetching items:", err);
      toast.error(err.response?.data?.message || "Error loading items");
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const filteredItems = items
        .filter(item => matchesSearch(item))
        .map(item => item.id);
      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([]);
    }
  };

  const matchesSearch = (item) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      (item.barcode && item.barcode.toLowerCase().includes(term)) ||
      item.category.toLowerCase().includes(term)
    );
  };

  const filteredItems = items.filter(matchesSearch);

  const handlePrint = async () => {
    if (selectedItems.length === 0) {
      toast.warning("Please select at least one item");
      return;
    }
    
    try {
      setLoading(true);
      
      // Get detailed item data for all selected items
      const itemsData = [];
      for (const itemId of selectedItems) {
        const response = await axios.get(
          `${url}/api/item/barcode/${itemId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          itemsData.push({
            ...response.data.data,
            copies: copies
          });
        }
      }
      
      if (itemsData.length === 0) {
        toast.error("Could not retrieve item data for printing");
        return;
      }
      
      // Open print window
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcodes</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 10px;
              }
              .barcode-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
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
            </style>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          </head>
          <body>
            <div class="barcode-grid">
      `);
      
      // Generate all barcodes
      let barcodeCount = 0;
      
      for (const item of itemsData) {
        const barcodeValue = item.barcode || item.sku;
        
        // Create canvas element
        printWindow.document.write(`
          <canvas id="barcode-${item.id}" style="display: none;"></canvas>
        `);
        
        // Add script to generate barcode
        printWindow.document.write(`
          <script>
            JsBarcode("#barcode-${item.id}", "${barcodeValue}", {
              format: "CODE128",
              width: 1.5,
              height: 40,
              displayValue: true,
              fontSize: 8,
              margin: 5,
              background: "#ffffff"
            });
          </script>
        `);
        
        // Add barcode containers
        for (let i = 0; i < item.copies; i++) {
          barcodeCount++;
          
          printWindow.document.write(`
            <div class="barcode-print-container">
              <div class="barcode-name">${item.name}</div>
              <div class="barcode-sku">SKU: ${item.sku}</div>
              <img src="document.getElementById('barcode-${item.id}').toDataURL('image/png')" 
                   class="barcode-image" 
                   onload="this.src = document.getElementById('barcode-${item.id}').toDataURL('image/png');" />
              <div class="barcode-price">LKR ${parseFloat(item.selling_price).toFixed(2)}</div>
            </div>
          `);
          
          // Add page break every 24 items
          if (barcodeCount % 24 === 0 && barcodeCount !== itemsData.length * item.copies) {
            printWindow.document.write('<div class="page-break"></div>');
          }
        }
      }
      
      printWindow.document.write(`
            </div>
            <script>
              window.onload = function() {
                // Fix image sources
                document.querySelectorAll('.barcode-image').forEach(function(img) {
                  const canvasId = img.getAttribute('onload').match(/document.getElementById\\('([^']+)'\\)/)[1];
                  img.src = document.getElementById(canvasId).toDataURL('image/png');
                });
                
                // Print after a slight delay to ensure images are loaded
                setTimeout(function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (err) {
      console.error("Error printing barcodes:", err);
      toast.error("Failed to print barcodes");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bulk-barcode-loading">
        <div className="loading-spinner"></div>
        <p>Loading items...</p>
      </div>
    );
  }

  return (
    <div className="bulk-barcode-container">
      <div className="bulk-barcode-header">
        <h2>Bulk Barcode Printing</h2>
        <button 
          className="back-btn"
          onClick={() => navigate('/list')}
        >
          Back to Items
        </button>
      </div>

      <div className="bulk-print-controls">
        <div className="search-filter">
          <input 
            type="text"
            placeholder="Search items by name, SKU, barcode, or category"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="copies-control">
          <label htmlFor="copies">Copies per item:</label>
          <input 
            type="number" 
            id="copies" 
            min="1" 
            max="10"
            value={copies}
            onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
          />
        </div>
        
        <button 
          className="print-selected-btn"
          onClick={handlePrint}
          disabled={selectedItems.length === 0}
        >
          Print {selectedItems.length} {selectedItems.length === 1 ? 'Item' : 'Items'}
        </button>
      </div>

      <div className="items-table-container">
        <table className="items-table">
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={filteredItems.length > 0 && 
                    filteredItems.every(item => selectedItems.includes(item.id))}
                />
              </th>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <tr key={item.id}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleItemSelect(item.id)}
                    />
                  </td>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.category}</td>
                  <td>LKR {parseFloat(item.selling_price).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-items-message">
                  {searchTerm ? "No items match your search" : "No items available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BulkBarcodePrint;