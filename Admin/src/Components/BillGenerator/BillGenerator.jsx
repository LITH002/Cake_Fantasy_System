import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { toast } from 'react-toastify';
import './BillGenerator.css';
import assets from '../../assets/assets';

const BillGenerator = ({ orderData, onClose }) => {
  const [generating, setGenerating] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const formatCurrency = (amount) => {
    return `LKR ${parseFloat(amount).toFixed(2)}`;
  };

  const generateInvoicePDF = async () => {
    try {
      setGenerating(true);
      toast.info("Generating PDF invoice...");
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      // Header with improved spacing
      doc.setFillColor(89, 27, 13);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Logo handling
      const logoImg = new Image();
      logoImg.src = assets.font;
      
      logoImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = logoImg.width;
        canvas.height = logoImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(logoImg, 0, 0);
        
        const logoDataUrl = canvas.toDataURL('image/png');
        doc.addImage(logoDataUrl, 'PNG', margin, 12, 60, 18);
        completeInvoiceGeneration();
      };
      
      logoImg.onerror = () => {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('CAKE FANTASY', margin, 25);
        completeInvoiceGeneration();
      };
      
      setTimeout(() => {
        if (!logoImg.complete) {
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(22);
          doc.text('CAKE FANTASY', margin, 25);
          completeInvoiceGeneration();
        }
      }, 1000);
      
      const completeInvoiceGeneration = () => {
        // Invoice header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('INVOICE', pageWidth - margin, 25, { align: 'right' });
        
        let y = 55;
        
        // Invoice details with better typography
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`Invoice #${orderData.id}`, margin, y);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Date: ${formatDate(orderData.created_at)}`, pageWidth - margin, y, { align: 'right' });
        
        y += 12;
        
        // Customer section with improved layout
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, contentWidth, 35, 'F');
        doc.setDrawColor(220, 220, 220);
        doc.rect(margin, y, contentWidth, 35, 'S');
        
        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('CUSTOMER INFORMATION', margin + 5, y);
        
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(`Name: ${orderData.first_name} ${orderData.last_name}`, margin + 5, y);
        
        y += 7;
        if (orderData.contact_number1) {
          doc.text(`Phone: ${orderData.contact_number1}`, margin + 5, y);
          y += 7;
        }
        
        if (orderData.address) {
          const addressLines = doc.splitTextToSize(`Address: ${orderData.address}`, contentWidth - 10);
          doc.text(addressLines, margin + 5, y);
          y += (addressLines.length * 7);
        }
        
        y += 10;
        
        // Items table with better spacing
        doc.setFillColor(89, 27, 13);
        doc.setTextColor(255, 255, 255);
        doc.rect(margin, y, contentWidth, 12, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ITEM', margin + 5, y + 9);
        doc.text('QTY', margin + 100, y + 9);
        doc.text('PRICE', margin + 130, y + 9);
        doc.text('TOTAL', pageWidth - margin - 15, y + 9, { align: 'right' });
        
        y += 16;
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        
        let altRow = false;
        
        if (orderData.items && orderData.items.length > 0) {
          for (const item of orderData.items) {
            if (altRow) {
              doc.setFillColor(245, 245, 245);
              doc.rect(margin, y - 5, contentWidth, 12, 'F');
            }
            altRow = !altRow;
            
            const itemName = item.name || 'Product Item';
            const displayItemName = itemName.length > 35 ? itemName.substring(0, 32) + '...' : itemName;
            
            doc.text(displayItemName, margin + 5, y + 4);
            doc.text(`${item.quantity || 1} ${item.unit || 'pcs'}`, margin + 100, y + 4);
            doc.text(`LKR ${parseFloat(item.price).toFixed(2)}`, margin + 130, y + 4);
            doc.text(`LKR ${(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}`, pageWidth - margin - 15, y + 4, { align: 'right' });
            
            y += 12;
            
            if (y > pageHeight - 60) {
              doc.addPage();
              y = 30;
            }
          }
        } else {
          doc.text("No items found", margin + 5, y + 4);
          y += 12;
        }
        
        // Totals section with better visual hierarchy
        y += 10;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, margin + contentWidth, y);
        
        y += 15;
        
        const subtotal = parseFloat(orderData.amount).toFixed(2);
        const deliveryFee = orderData.delivery_fee ? parseFloat(orderData.delivery_fee).toFixed(2) : '0.00';
        const total = (parseFloat(subtotal) + parseFloat(deliveryFee)).toFixed(2);
        
        doc.setFontSize(12);
        doc.text('Subtotal:', pageWidth - margin - 60, y);
        doc.text(`LKR ${subtotal}`, pageWidth - margin - 15, y, { align: 'right' });
        
        if (parseFloat(deliveryFee) > 0) {
          y += 10;
          doc.text('Delivery Fee:', pageWidth - margin - 60, y);
          doc.text(`LKR ${deliveryFee}`, pageWidth - margin - 15, y, { align: 'right' });
        }
        
        y += 15;
        doc.setFillColor(245, 245, 245);
        doc.rect(pageWidth - margin - 120, y - 5, 120, 14, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('TOTAL:', pageWidth - margin - 60, y + 4);
        doc.text(`LKR ${total}`, pageWidth - margin - 15, y + 4, { align: 'right' });
        
        // Footer with improved spacing
        const footerY = pageHeight - 20;
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('Thank you for your business!', pageWidth / 2, footerY - 10, { align: 'center' });
        doc.text('Cake Fantasy - Premium Baking Supplies', pageWidth / 2, footerY - 5, { align: 'center' });
        doc.text(`Invoice generated on ${new Date().toLocaleString()}`, pageWidth / 2, footerY, { align: 'center' });
        
        doc.save(`Cake_Fantasy_Invoice_${orderData.id}.pdf`);
        setGenerating(false);
        toast.success("Invoice PDF generated successfully!");
      };
    } catch (error) {
      console.error("Error generating invoice:", error);
      setGenerating(false);
      toast.error("Failed to generate invoice. Please try again.");
    }
  };
  
  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${orderData.id}</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; color: #333; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .header { background: #591b0d; color: white; padding: 20px; display: flex; justify-content: space-between; }
            .invoice-title { font-size: 24px; font-weight: bold; }
            .invoice-meta { margin: 20px 0; display: flex; justify-content: space-between; }
            .customer-info { background: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th { background: #591b0d; color: white; padding: 10px; text-align: left; }
            .items-table td { padding: 10px; border-bottom: 1px solid #eee; }
            .items-table tr:nth-child(even) { background: #f9f9f9; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .total-row.final { font-weight: bold; font-size: 18px; border-top: 2px solid #591b0d; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div class="invoice-title">CAKE FANTASY</div>
              <div class="invoice-title">INVOICE #${orderData.id}</div>
            </div>
            
            <div class="invoice-meta">
              <div>
                <p><strong>Date:</strong> ${formatDate(orderData.created_at)}</p>
                <p><strong>Status:</strong> ${orderData.status}</p>
                <p><strong>Payment:</strong> <span style="color: ${orderData.payment ? '#28a745' : '#dc3545'}">
                  ${orderData.payment ? 'Paid' : 'Unpaid'}
                </span></p>
              </div>
            </div>
            
            <div class="customer-info">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> ${orderData.first_name} ${orderData.last_name}</p>
              ${orderData.contact_number1 ? `<p><strong>Phone:</strong> ${orderData.contact_number1}</p>` : ''}
              ${orderData.email ? `<p><strong>Email:</strong> ${orderData.email}</p>` : ''}
              ${orderData.address ? `<p><strong>Address:</strong> ${orderData.address}</p>` : ''}
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.items.map(item => `
                  <tr>
                    <td>${item.name || 'Product Item'}</td>
                    <td>${item.quantity || 1} ${item.unit || 'pcs'}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(parseFloat(item.price) * parseFloat(item.quantity || 1))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(orderData.amount)}</span>
              </div>
              ${orderData.delivery_fee ? `
                <div class="total-row">
                  <span>Delivery Fee:</span>
                  <span>${formatCurrency(orderData.delivery_fee)}</span>
                </div>
              ` : ''}
              <div class="total-row final">
                <span>Total:</span>
                <span>${formatCurrency(parseFloat(orderData.amount) + (parseFloat(orderData.delivery_fee) || 0))}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Cake Fantasy - Premium Baking Supplies</p>
            </div>
          </div>
          <script>setTimeout(() => window.print(), 300);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bill-generator">
      <div className="bill-header">
        <h2>Invoice Generator</h2>
        <button className="close-bill-btn" onClick={onClose}>&times;</button>
      </div>
      
      <div className="bill-actions">
        <button 
          className="generate-pdf-btn" 
          onClick={generateInvoicePDF}
          disabled={generating}
        >
          {generating ? (
            <>
              <span className="spinner"></span>
              Generating PDF...
            </>
          ) : 'Download PDF Invoice'}
        </button>
        <button className="print-invoice-btn" onClick={printInvoice}>
          Print Invoice
        </button>
      </div>
      
      <div className="bill-preview">
        <div className="preview-header">
          <div className="preview-logo">
            <img src={assets.font} alt="Cake Fantasy" />
          </div>
          <div className="invoice-number">INVOICE #{orderData.id}</div>
        </div>
        
        <div className="preview-content">
          <div className="invoice-meta">
            <div className="meta-item">
              <span className="meta-label">Date:</span>
              <span className="meta-value">{formatDate(orderData.created_at)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Status:</span>
              <span className="meta-value">{orderData.status}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Payment:</span>
              <span className={`meta-value ${orderData.payment ? 'paid' : 'unpaid'}`}>
                {orderData.payment ? 'Paid' : 'Unpaid'}
              </span>
            </div>
          </div>
          
          <div className="customer-section">
            <h3>Customer Information</h3>
            <div className="customer-details">
              <div className="customer-detail">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{orderData.first_name} {orderData.last_name}</span>
              </div>
              {orderData.contact_number1 && (
                <div className="customer-detail">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{orderData.contact_number1}</span>
                </div>
              )}
              {orderData.email && (
                <div className="customer-detail">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{orderData.email}</span>
                </div>
              )}
              {orderData.address && (
                <div className="customer-detail">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{orderData.address}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="items-section">
            <h3>Order Items</h3>
            <div className="table-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.items && orderData.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name || 'Product Item'}</td>
                      <td>{item.quantity || 1} {item.unit || 'pcs'}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{formatCurrency(parseFloat(item.price) * parseFloat(item.quantity || 1))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="totals-section">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(orderData.amount)}</span>
            </div>
            {orderData.delivery_fee && (
              <div className="total-row">
                <span>Delivery Fee:</span>
                <span>{formatCurrency(orderData.delivery_fee)}</span>
              </div>
            )}
            <div className="total-row final-total">
              <span>Total:</span>
              <span>
                {formatCurrency(parseFloat(orderData.amount) + (parseFloat(orderData.delivery_fee) || 0))}
              </span>
            </div>
          </div>
          
          <div className="thank-you">
            Thank you for your business!
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillGenerator;