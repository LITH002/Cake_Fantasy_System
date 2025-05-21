import React, { useState, useEffect, useContext, useCallback } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdminAuthContext } from '../../context/AdminAuthContext';
import './POS.css';

const POS = ({ url }) => {
  const { token } = useContext(AdminAuthContext);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${url}/api/item/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const items = response.data.data;
        setProducts(items);
        setFilteredProducts(items);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(items.map(item => item.category))];
        setCategories(uniqueCategories);
      } else {
        setError("Failed to load products");
        toast.error("Could not load product inventory");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Error loading products. Please try again.");
      toast.error(error.response?.data?.message || "Error loading products");
    } finally {
      setLoading(false);
    }
  }, [url, token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;
    
    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(term) || 
        product.sku?.toLowerCase().includes(term) || 
        product.barcode?.toLowerCase().includes(term)
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter]);

  // Calculate total whenever cart changes
  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setTotal(newTotal);
    
    // Reset change calculation when cart changes
    setAmountReceived('');
    setChange(0);
  }, [cart]);

  // Calculate change when amount received changes
  useEffect(() => {
    if (amountReceived) {
      const received = parseFloat(amountReceived);
      const changeAmount = received - total;
      setChange(changeAmount >= 0 ? changeAmount : 0);
    } else {
      setChange(0);
    }
  }, [amountReceived, total]);

  // Add product to cart
  const addToCart = (product) => {
    // Check if product has stock
    if (product.stock_quantity <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    // Check if product already in cart
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Check if adding more would exceed stock
      if (existingItem.quantity + 1 > product.stock_quantity) {
        toast.error(`Only ${product.stock_quantity} ${product.unit} available in stock`);
        return;
      }
      
      // Update quantity
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Add new item to cart
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: parseFloat(product.selling_price),
        quantity: 1,
        unit: product.unit,
        image: product.image,
        stock: product.stock_quantity
      }]);
    }
    
    toast.success(`Added ${product.name} to cart`);
  };

  // Update quantity in cart
  const updateQuantity = (id, newQuantity) => {
    // Find the product to check stock
    const product = products.find(p => p.id === id);
    const cartItem = cart.find(item => item.id === id);
    
    if (!product || !cartItem) return;
    
    // Validate new quantity
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or negative
      setCart(cart.filter(item => item.id !== id));
      toast.info(`${cartItem.name} removed from cart`);
      return;
    }
    
    // Check if new quantity exceeds stock
    if (newQuantity > product.stock_quantity) {
      toast.error(`Only ${product.stock_quantity} ${product.unit} available in stock`);
      return;
    }
    
    // Update quantity
    setCart(cart.map(item => 
      item.id === id 
        ? { ...item, quantity: newQuantity } 
        : item
    ));
  };

  // Remove item from cart
  const removeItem = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Clear the entire cart
  const clearCart = () => {
    setCart([]);
    setCustomerInfo({
      firstName: '',
      lastName: '',
      phone: '',
    });
    setPaymentMethod('cash');
    setAmountReceived('');
    setChange(0);
  };

  // Process the sale
  const processSale = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    
    if (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < total)) {
      toast.error("Amount received must be at least the total amount");
      return;
    }
    
    try {
      setProcessing(true);
      
      // Create order data
      const orderData = {
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity
        })),
        customer: {
          firstName: customerInfo.firstName || 'Walk-in',
          lastName: customerInfo.lastName || 'Customer',
          contactNumber: customerInfo.phone || '',
        },
        payment: true, // POS sales are immediately paid
        paymentMethod: paymentMethod,
        amount: total,
        status: 'Delivered', // POS sales are immediately delivered
        orderType: 'pos'
      };
      
      // Submit order
      const response = await axios.post(`${url}/api/order/create-pos`, orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success("Sale completed successfully");
        
        // Generate receipt
        generateReceipt(response.data.orderId, orderData);
        
        // Clear cart and reset form
        clearCart();
      } else {
        toast.error(response.data.message || "Failed to process sale");
      }
    } catch (error) {
      console.error("Error processing sale:", error);
      toast.error(error.response?.data?.message || "Error processing sale");
    } finally {
      setProcessing(false);
    }
  };

  // Generate and print receipt
  const generateReceipt = (orderId, orderData) => {
    const receiptWindow = window.open('', '_blank');
    
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Receipt #${orderId}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 20px;
              width: 80mm;
              max-width: 80mm;
            }
            .receipt {
              width: 100%;
              border: 1px solid #ddd;
              padding: 10px;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .receipt-header h1 {
              font-size: 18px;
              margin: 0 0 5px 0;
            }
            .receipt-header p {
              font-size: 12px;
              margin: 0;
            }
            .receipt-body {
              margin-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            th, td {
              padding: 5px;
              text-align: left;
              font-size: 12px;
            }
            th:last-child, td:last-child {
              text-align: right;
            }
            .receipt-footer {
              text-align: center;
              border-top: 1px dashed #000;
              padding-top: 10px;
              font-size: 12px;
            }
            .total-line {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 12px;
            }
            .total-line.grand-total {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #000;
              padding-top: 5px;
            }
            .customer-info {
              margin-bottom: 10px;
              font-size: 12px;
            }
            @media print {
              body {
                width: 80mm;
                margin: 0;
                padding: 0;
              }
              .receipt {
                border: none;
                width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-header">
              <h1>Cake Fantasy</h1>
              <p>123 Bakers Street, Colombo</p>
              <p>Tel: +94 11 123 4567</p>
              <p>Receipt #${orderId}</p>
              <p>${new Date().toLocaleString()}</p>
            </div>
            
            <div class="customer-info">
              <p>Customer: ${orderData.customer.firstName} ${orderData.customer.lastName}</p>
              ${orderData.customer.contactNumber ? `<p>Phone: ${orderData.customer.contactNumber}</p>` : ''}
            </div>
            
            <div class="receipt-body">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${cart.map(item => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.quantity} ${item.unit}</td>
                      <td>LKR ${item.price.toFixed(2)}</td>
                      <td>LKR ${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="total-section">
                <div class="total-line">
                  <span>Subtotal:</span>
                  <span>LKR ${total.toFixed(2)}</span>
                </div>
                <div class="total-line grand-total">
                  <span>Total:</span>
                  <span>LKR ${total.toFixed(2)}</span>
                </div>
                <div class="total-line">
                  <span>Payment Method:</span>
                  <span>${paymentMethod.toUpperCase()}</span>
                </div>
                ${paymentMethod === 'cash' ? `
                <div class="total-line">
                  <span>Amount Received:</span>
                  <span>LKR ${parseFloat(amountReceived).toFixed(2)}</span>
                </div>
                <div class="total-line">
                  <span>Change:</span>
                  <span>LKR ${change.toFixed(2)}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="receipt-footer">
              <p>Thank you for shopping with us!</p>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    
    receiptWindow.document.close();
  };

  return (
    <div className="pos-container">
      <div className="pos-header">
        <h1>Point of Sale</h1>
      </div>
      
      <div className="pos-layout">
        {/* Left Side - Product Search & Selection */}
        <div className="pos-products-section">
          <div className="pos-search-container">
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pos-search-input"
            />
            
            <div className="pos-category-filter">
              <button
                className={categoryFilter === 'all' ? 'active' : ''}
                onClick={() => setCategoryFilter('all')}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  className={categoryFilter === category ? 'active' : ''}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="pos-loading">
              <div className="loading-spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : error ? (
            <div className="pos-error">
              <p>{error}</p>
              <button onClick={fetchProducts}>Try Again</button>
            </div>
          ) : (
            <div className="pos-products-grid">
              {filteredProducts.length === 0 ? (
                <p className="no-products-message">No products found</p>
              ) : (
                filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className={`pos-product-card ${product.stock_quantity <= 0 ? 'out-of-stock' : ''}`}
                    onClick={() => product.stock_quantity > 0 && addToCart(product)}
                  >
                    <div className="pos-product-image">
                      <img src={product.image} alt={product.name} />
                    </div>
                    <div className="pos-product-info">
                      <h3>{product.name}</h3>
                      <p className="pos-product-price">LKR {parseFloat(product.selling_price).toFixed(2)}</p>
                      <p className={`pos-product-stock ${product.stock_quantity <= product.reorder_level ? 'low-stock' : ''}`}>
                        {product.stock_quantity > 0 
                          ? `In stock: ${product.stock_quantity} ${product.unit}`
                          : 'Out of stock'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        {/* Right Side - Shopping Cart */}
        <div className="pos-cart-section">
          <div className="pos-cart-header">
            <h2>Current Sale</h2>
            <button 
              className="clear-cart-btn"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              Clear All
            </button>
          </div>
          
          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart-message">No items in cart</p>
            ) : (
              cart.map(item => (
                <div key={item.id} className="pos-cart-item">
                  <div className="pos-cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="pos-cart-item-details">
                    <h4>{item.name}</h4>
                    <p className="pos-cart-item-price">LKR {item.price.toFixed(2)}</p>
                  </div>
                  <div className="pos-cart-item-quantity">
                    <button 
                      className="quantity-btn minus"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{item.quantity} {item.unit}</span>
                    <button 
                      className="quantity-btn plus"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </div>
                  <div className="pos-cart-item-subtotal">
                    LKR {(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    className="remove-item-btn"
                    onClick={() => removeItem(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="pos-cart-totals">
            <div className="pos-cart-total">
              <span>Subtotal:</span>
              <span>LKR {total.toFixed(2)}</span>
            </div>
            <div className="pos-cart-total grand-total">
              <span>Total:</span>
              <span>LKR {total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="pos-customer-info">
            <h3>Customer Information (Optional)</h3>
            <div className="pos-form-row">
              <div className="pos-form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                  placeholder="First Name"
                />
              </div>
              <div className="pos-form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={customerInfo.lastName}
                  onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                  placeholder="Last Name"
                />
              </div>
            </div>
            <div className="pos-form-group">
              <label>Phone</label>
              <input
                type="text"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                placeholder="Phone Number"
              />
            </div>
          </div>
          
          <div className="pos-payment-section">
            <h3>Payment</h3>
            <div className="pos-payment-methods">
              <button 
                className={`payment-method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                Cash
              </button>
              <button 
                className={`payment-method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('card')}
              >
                Card
              </button>
              <button 
                className={`payment-method-btn ${paymentMethod === 'online' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('online')}
              >
                Online
              </button>
            </div>
            
            {paymentMethod === 'cash' && (
              <div className="pos-cash-payment">
                <div className="pos-form-group">
                  <label>Amount Received (LKR)</label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="0.00"
                    min={total}
                    step="0.01"
                  />
                </div>
                <div className="pos-change-amount">
                  <span>Change:</span>
                  <span>LKR {change.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          
          <button
            className="pos-checkout-btn"
            disabled={cart.length === 0 || processing || (paymentMethod === 'cash' && (!amountReceived || parseFloat(amountReceived) < total))}
            onClick={processSale}
          >
            {processing ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;