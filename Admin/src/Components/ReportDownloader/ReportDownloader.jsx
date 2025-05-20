import React, { useEffect, useState } from 'react';
import { CSVLink } from 'react-csv';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './ReportDownloader.css';
import assets from '../../assets/assets'; 

const ReportDownloader = ({ data, reportName, pdfHeaders, csvHeaders, reportSummary }) => {
  const [showPreview, setShowPreview] = useState(false);
  
  const generateFileName = (extension) => {
    const date = new Date().toISOString().slice(0, 10);
    return `Cake_Fantasy_${reportName}_${date}.${extension}`;
  };

  useEffect(() => {
    // Check if jsPDF is available after component mounts
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
        console.warn('jsPDF library not detected, attempting to load from CDN');
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.async = true;
        document.body.appendChild(script);
    }
    }, []);

  const downloadPDF = () => {
    try {
      // Create a new PDF document
      const { jsPDF } = window.jspdf;
      let doc;
      
      // Try different ways to initialize jsPDF based on how it might be available
      if (typeof jsPDF === 'function') {
        doc = new jsPDF();
      } else if (typeof window.jspdf !== 'undefined') {
        doc = new window.jspdf.jsPDF();
      } else {
        doc = new jsPDF();
      }
      
      // Check if autotable plugin is available
      if (typeof doc.autoTable !== 'function') {
        console.error("autoTable plugin not found, loading from CDN");
        alert("PDF generation requires additional components. Please try again in a few seconds.");
        
        // Dynamically load autotable if needed
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js';
        script.async = true;
        document.body.appendChild(script);
        return; // Exit and let user try again after script loads
      }
      
      // Set brand colors
      const primaryColor = [89, 27, 13]; // #591b0d
      const secondaryColor = [133, 77, 39]; // #854D27
      const textColor = [51, 51, 51]; // #333

      // Add header background
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
      
      // Add CF_Font logo
      const fontImg = new Image();
      fontImg.src = assets.font;
      
      // Create a temp canvas to get logo as data URL (this approach works better with jsPDF)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 200;
      canvas.height = 40;
      
      // Load and draw the image
      fontImg.onload = function() {
        ctx.drawImage(fontImg, 0, 0, 200, 40);
        
        // Add logo to PDF
        const logoDataUrl = canvas.toDataURL('image/png');
        doc.addImage(logoDataUrl, 'PNG', 14, 5, 60, 20);
        
        // Continue with the rest of the PDF
        completePdfGeneration(doc);
      };
      
      fontImg.onerror = function() {
        console.error("Error loading CF_Font image");
        // Continue with PDF generation even if logo fails to load
        completePdfGeneration(doc);
      };
      
      // Define the function to complete PDF generation
      const completePdfGeneration = (doc) => {
        let yPos = 40;
        
        // Add date and time
        const currentDate = new Date().toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        
        const currentTime = new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Add report title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(`${reportName} Report`, 120, 15, { align: 'right' });
        
        // Add generation timestamp
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(10);
        doc.text(`Generated on: ${currentDate} at ${currentTime}`, 14, yPos);
        yPos += 10;
        
        // Add report summary if provided
        if (reportSummary && Object.keys(reportSummary).length > 0) {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Report Summary", 14, yPos);
          yPos += 7;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          
          // Format summary keys to be more readable (remove camelCase and underscores)
          Object.entries(reportSummary).forEach(([key, value]) => {
            const formattedKey = key
              .replace(/([A-Z])/g, ' $1') // Add space before capital letters
              .replace(/_/g, ' ') // Replace underscores with spaces
              .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
              
            doc.text(`${formattedKey}: ${value}`, 14, yPos);
            yPos += 6;
          });
          
          yPos += 5;
        }
        
        // Create table data
        const tableData = data.map(item => {
          return pdfHeaders.map(header => {
            let value = item[header.key];
            
            // Format currency values
            if (header.isCurrency && value !== undefined) {
              return `LKR ${parseFloat(value).toFixed(2)}`;
            }
            
            // Format percentage values
            if (header.isPercentage && value !== undefined) {
              return `${parseFloat(value).toFixed(2)}%`;
            }
            
            return value !== undefined ? value : 'N/A';
          });
        });
        
        // Add table
       try {
        doc.autoTable({
          head: [pdfHeaders.map(header => header.label)],
          body: tableData,
          startY: yPos,
          theme: 'grid',
          styles: { 
            fontSize: 9,
            cellPadding: 3,
            lineColor: [200, 200, 200]
          },
          headStyles: { 
            fillColor: secondaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: { 
            fillColor: [245, 245, 245] 
          },
          margin: { top: 30 }
        });
      } catch (tableError) {
        console.error("Error creating table:", tableError);
        
        // Fall back to a basic table if autotable fails
        doc.setFontSize(12);
        doc.text("Report Data", 14, yPos);
        
        // Draw a basic table manually if autoTable fails
        yPos += 10;
        pdfHeaders.forEach((header, i) => {
          doc.text(header.label, 14 + (i * 30), yPos);
        });
        
        yPos += 5;
        doc.line(14, yPos, 14 + (pdfHeaders.length * 30), yPos);
        
        yPos += 5;
        // Just display first few rows
        data.slice(0, 10).forEach((row, rowIndex) => {
          pdfHeaders.forEach((header, colIndex) => {
            let value = row[header.key] || 'N/A';
            doc.text(String(value).substring(0, 10), 14 + (colIndex * 30), yPos + (rowIndex * 10));
          });
        });
      }
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.text(
            'Cake Fantasy System - Confidential',
            14,
            doc.internal.pageSize.height - 10
          );
          doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width - 30,
            doc.internal.pageSize.height - 10
          );
        }
        
        // Save PDF
        doc.save(generateFileName('pdf'));
      };
      
      // If the image doesn't load automatically, call completePdfGeneration manually after a timeout
      setTimeout(() => {
        if (!fontImg.complete) {
          console.warn("Image load timed out, generating PDF without logo");
          completePdfGeneration(doc);
        }
      }, 1000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="report-downloader">
      <button 
        type="button" 
        className="preview-btn" 
        onClick={togglePreview}
        title="Preview Report"
      >
        Preview
      </button>
      
      <button className="csv-download-btn" title="Download as CSV">
        <CSVLink 
          data={data} 
          headers={csvHeaders}
          filename={generateFileName('csv')}
          className="csv-link"
        >
          CSV
        </CSVLink>
      </button>
      
      <button 
        className="pdf-download-btn" 
        onClick={downloadPDF} 
        title="Download as PDF"
      >
        PDF
      </button>
      
      {showPreview && (
        <div className="report-preview-overlay">
          <div className="report-preview-container">
            <div className="preview-header">
              <img src={assets.font} alt="Cake Fantasy" className="preview-logo" />
              <h3>{reportName} Report</h3>
              <button 
                className="close-preview-btn" 
                onClick={togglePreview}
              >
                &times;
              </button>
            </div>
            
            <div className="preview-content">
              {reportSummary && Object.keys(reportSummary).length > 0 && (
                <div className="preview-summary">
                  <h4>Report Summary</h4>
                  <table className="summary-table">
                    <tbody>
                      {Object.entries(reportSummary).map(([key, value], index) => {
                        const formattedKey = key
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/_/g, ' ')
                          .replace(/^\w/, c => c.toUpperCase());
                        
                        return (
                          <tr key={index}>
                            <td>{formattedKey}:</td>
                            <td>{value}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {pdfHeaders.map((header, index) => (
                        <th key={index}>{header.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 10).map((item, rowIndex) => (
                      <tr key={rowIndex}>
                        {pdfHeaders.map((header, colIndex) => {
                          let value = item[header.key];
                          
                          if (header.isCurrency && value !== undefined) {
                            value = `LKR ${parseFloat(value).toFixed(2)}`;
                          }
                          
                          if (header.isPercentage && value !== undefined) {
                            value = `${parseFloat(value).toFixed(2)}%`;
                          }
                          
                          return (
                            <td key={colIndex}>
                              {value !== undefined ? value : 'N/A'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {data.length > 10 && (
                  <div className="preview-more">
                    ...and {data.length - 10} more items
                  </div>
                )}
              </div>
              
              <div className="preview-actions">
                <button className="download-btn" onClick={downloadPDF}>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDownloader;