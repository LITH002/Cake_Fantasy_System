import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import './ProductDetail.css';
import { toast } from 'react-toastify';
import ReviewSection from '../../components/ReviewSection/ReviewSection';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import io from 'socket.io-client';

const ProductDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { url, addToCart, cartItems, removeFromCart } = useContext(StoreContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityOptions, setQuantityOptions] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  useEffect(() => {
    const socket = io(url.replace('/api', ''));
    socket.on('inventory-updated', (data) => {
      if (data.type === 'grn-completed') {
        fetchItemDetails();
      }
    });
    return () => socket.disconnect();
  }, []);
  
  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/item/${itemId}`);
      
      if (response.data.success) {
        const productData = response.data.data;
        setProduct(productData);
        
        // Initialize quantity to minimum order quantity or 1
        const initialQty = productData.min_order_quantity || 1;
        setQuantity(productData.is_loose ? 
          parseFloat(initialQty) : 
          parseInt(initialQty));
        
        // Generate quantity options
        if (productData.is_loose) {
          const min = parseFloat(productData.min_order_quantity);
          const step = parseFloat(productData.increment_step);
          const max = Math.min(parseFloat(productData.stock_quantity), 1000);
          
          let currentQty = min;
          const options = [];
          
          while (currentQty <= max) {
            options.push({
              value: currentQty,
              label: `${currentQty} ${productData.unit}`
            });
            currentQty = parseFloat((currentQty + step).toFixed(2));
          }
          
          setQuantityOptions(options);
        } else {
          const max = Math.min(parseInt(productData.stock_quantity), 100);
          const options = Array.from({ length: max }, (_, i) => ({
            value: i + 1,
            label: `${i + 1} ${productData.unit}`
          }));
          setQuantityOptions(options);
        }
      } else {
        setError('Failed to fetch product details');
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Error loading product details');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchItemDetails();
  }, [url, itemId]);
  
  const handleQuantityChange = (e) => {
  if (!product) return;
  
  let newValue;
  if (product.is_loose) {
    newValue = parseFloat(parseFloat(e.target.value).toFixed(2));
  } else {
    newValue = parseInt(e.target.value);
  }
  
  if (isNaN(newValue)) {
    newValue = product.is_loose ? 
      parseFloat(product.min_order_quantity || 1) : 
      parseInt(product.min_order_quantity || 1);
  }
  
  const min = parseFloat(product.min_order_quantity || 1);
  const max = maxAllowedQuantity;
  
  // Ensure the value is within bounds
  if (newValue < min) newValue = min;
  if (newValue > max) newValue = max;
  
  // For loose items, ensure it follows the increment step
  if (product.is_loose && product.increment_step) {
    const step = parseFloat(product.increment_step);
    const minQty = parseFloat(product.min_order_quantity || 0);
    
    // Check if the difference from min quantity is a multiple of the step
    const diff = newValue - minQty;
    const remainder = diff % step;
    
    if (remainder !== 0) {
      // Round to the nearest valid step
      newValue = minQty + Math.round(diff / step) * step;
      // Ensure we're still within bounds after rounding
      if (newValue > max) newValue = max;
      if (newValue < min) newValue = min;
    }
  }
  
  // Format the value properly
  const formattedValue = product.is_loose ? 
    parseFloat(newValue.toFixed(2)) : 
    parseInt(newValue);
  
  setQuantity(formattedValue);
};
  
 const handleAddToCart = async () => {
  if (!product || product.stock_quantity <= 0) return;
  
  try {
    setIsAddingToCart(true);
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to add items to cart");
      navigate('/login');
      return;
    }
    
    // Send request directly to the API
    const response = await axios.post(
      `${url}/api/cart/add`,
      { 
        item_id: product.id,
        quantity: quantity
      },
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    if (response.data.success) {
      // Update context after successful API call
      addToCart(product.id, quantity);
      toast.success(`${quantity} ${product.unit || 'item(s)'} of ${product.name} added to cart!`);
    } else {
      toast.error(response.data.message || 'Failed to add to cart');
    }
  } catch (err) {
    console.error('Add to cart error:', err);
    toast.error(err.response?.data?.message || 'Error adding to cart');
  } finally {
    setIsAddingToCart(false);
  }
};
  
  if (loading && !product) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="product-detail-error">
        <h3>Error loading product</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="product-detail-error">
        <h3>Product not found</h3>
        <p>The requested product could not be found.</p>
        <button onClick={() => navigate('/products')}>Browse Products</button>
      </div>
    );
  }
  
  const currentCartQuantity = cartItems[product.id] || 0;
  const maxAllowedQuantity = Math.max(0, product.stock_quantity - currentCartQuantity);
  const canAddToCart = maxAllowedQuantity > 0 && quantity > 0;

  return (
    <div className="product-detail-container">
      <div className="product-detail-navigation">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Products
        </button>
      </div>
      
      <div className="product-detail">
        <div className="product-detail-content">
          <div className="product-detail-image">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name} 
                className="product-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/placeholder.jpg';
                }}
              />
            ) : (
              <div className="image-placeholder">
                <span>No image available</span>
              </div>
            )}
          </div>
          
          <div className="product-detail-info">
            <div className="product-header">
              <h1 className="product-name">{product.name}</h1>
              <div className="product-meta">
                <span className="product-category">{product.category}</span>
                {product.weight_value && (
                  <span className="product-weight">
                    {product.weight_value} {product.weight_unit}
                  </span>
                )}
              </div>
            </div>
            
            <div className="product-price-section">
              <span className="product-price">
                LKR {parseFloat(product.selling_price).toFixed(2)}
              </span>
            </div>
            
            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description || 'No description available'}</p>
            </div>
            
            <div className="product-actions">
              <div className="quantity-control">
                <label htmlFor="quantity">Quantity:</label>
                <div className="quantity-input-group">                  <button 
                    type="button" 
                    className="quantity-btn decrease"
                    onClick={() => {
                      if (!product) return;
                      
                      let newValue;
                      if (product.is_loose) {
                        const step = parseFloat(product.increment_step || 0.1);
                        newValue = parseFloat((quantity - step).toFixed(2));
                        
                        // Ensure decrement follows the valid increments based on min and step
                        const min = parseFloat(product.min_order_quantity || 1);
                        const diff = newValue - min;
                        
                        // If below min, set to min. Otherwise, ensure it's on a valid step
                        if (newValue < min) {
                          newValue = min;
                        } else if (diff % step !== 0) {
                          // Round down to nearest valid step
                          newValue = min + Math.floor(diff / step) * step;
                        }
                      } else {
                        newValue = quantity - 1;
                      }
                      
                      const min = parseFloat(product.min_order_quantity || 1);
                      newValue = Math.max(min, newValue);
                      
                      setQuantity(newValue);
                    }}
                    disabled={quantity <= (product.min_order_quantity || 1)}
                  >
                    -
                  </button>
                  
                  <input
                    type="number"
                    id="quantity"
                    className="quantity-input"
                    value={quantity}
                    onChange={handleQuantityChange}
                    min={product.min_order_quantity || 1}
                    max={maxAllowedQuantity}
                    step={product.is_loose ? (product.increment_step || 0.1) : 1}
                  />
                    <button 
                    type="button" 
                    className="quantity-btn increase"
                    onClick={() => {
                      if (!product) return;
                      
                      let newValue;
                      if (product.is_loose) {
                        const step = parseFloat(product.increment_step || 0.1);
                        const min = parseFloat(product.min_order_quantity || 1);
                        
                        // Calculate the next step increment
                        newValue = parseFloat((quantity + step).toFixed(2));
                        
                        // Ensure increment follows the valid increments
                        const diff = newValue - min;
                        
                        // If it's not a multiple of the step size, adjust to the nearest valid value
                        if (diff % step !== 0) {
                          newValue = min + Math.round(diff / step) * step;
                          newValue = parseFloat(newValue.toFixed(2)); // Fix floating point precision issues
                        }
                      } else {
                        newValue = quantity + 1;
                      }
                      
                      const max = maxAllowedQuantity;
                      newValue = Math.min(max, newValue);
                      
                      setQuantity(newValue);
                    }}
                    disabled={quantity >= maxAllowedQuantity}
                  >
                    +
                  </button>
                </div>
                {currentCartQuantity > 0 && (
                  <div className="cart-quantity-info">
                    {currentCartQuantity} in cart ({maxAllowedQuantity} available)
                  </div>
                )}
              </div>
              
              <button 
                className={`add-to-cart-button ${!canAddToCart ? 'disabled' : ''}`}
                onClick={handleAddToCart}
                disabled={!canAddToCart || isAddingToCart}
              >
                {isAddingToCart ? (
                  <span className="spinner"></span>
                ) : product.stock_quantity <= 0 ? (
                  'Out of Stock'
                ) : (
                  'Add to Cart'
                )}
              </button>
            </div>
            
            <div className="product-stock-info">
              <span className={`stock-status ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {product.stock_quantity > 0 ? 
                  `In Stock (${product.stock_quantity} ${product.unit} available)` : 
                  'Out of Stock'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="product-reviews-container">
        <h2 className="reviews-title">Customer Reviews</h2>
        <React.Suspense fallback={<div className="loading-reviews">Loading reviews...</div>}>
          <ErrorBoundary fallback={
            <div className="review-error-fallback">
              <h3>Something went wrong</h3>
              <p>There was a problem loading the reviews.</p>
              <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
          }>
            <ReviewSection itemId={itemId} />
          </ErrorBoundary>
        </React.Suspense>
      </div>
    </div>
  );
};

export default ProductDetail;