import React, { useRef } from 'react';
import JsBarcode from 'jsbarcode';
import './BarcodeGenerator.css';

const BarcodeGenerator = ({ 
  value, 
  name, 
  price, 
  sku, 
  width = 2, 
  height = 100, 
  fontSize = 14,
  displayValue = true,
  onPrint
}) => {
  const canvasRef = useRef(null);
  const barcodeContainerRef = useRef(null);

  React.useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue,
          fontSize,
          margin: 10,
          background: "#ffffff"
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
        // Fallback to simple text if barcode generation fails
        const ctx = canvasRef.current.getContext('2d');
        ctx.font = `${fontSize}px Arial`;
        ctx.fillText(`Invalid Barcode: ${value}`, 10, height / 2);
      }
    }
  }, [value, width, height, displayValue, fontSize]);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    if (barcodeContainerRef.current) {
      const printWindow = window.open('', '_blank');
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
              }
              .barcode-print-container {
                width: 300px;
                padding: 10px;
                border: 1px solid #ddd;
                margin: 10px auto;
                text-align: center;
              }
              .barcode-name {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 5px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .barcode-sku {
                font-size: 12px;
                color: #666;
                margin-bottom: 5px;
              }
              .barcode-price {
                font-size: 16px;
                font-weight: bold;
                margin-top: 5px;
              }
              @media print {
                body {
                  width: 58mm; /* Standard receipt width */
                  margin: 0;
                }
                .barcode-print-container {
                  width: 100%;
                  border: none;
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="barcode-print-container">
              ${name ? `<div class="barcode-name">${name}</div>` : ''}
              ${sku ? `<div class="barcode-sku">SKU: ${sku}</div>` : ''}
              <img src="${canvasRef.current.toDataURL('image/png')}" />
              ${price ? `<div class="barcode-price">LKR ${parseFloat(price).toFixed(2)}</div>` : ''}
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
    }
  };

  return (
    <div className="barcode-generator" ref={barcodeContainerRef}>
      <div className="barcode-content">
        {name && <div className="barcode-name">{name}</div>}
        {sku && <div className="barcode-sku">SKU: {sku}</div>}
        <canvas ref={canvasRef} className="barcode-canvas"></canvas>
        {price && <div className="barcode-price">LKR {parseFloat(price).toFixed(2)}</div>}
      </div>
      <button className="print-barcode-btn" onClick={handlePrint}>
        Print Barcode
      </button>
    </div>
  );
};

export default BarcodeGenerator;