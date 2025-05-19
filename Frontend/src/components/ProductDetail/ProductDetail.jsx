import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import './ProductDetail.css';
import { toast } from 'react-toastify';
import ReviewSection from '../../components/ReviewSection/ReviewSection';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';

const ProductDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { url, addToCart, cartItems, removeFromCart } = useContext(StoreContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityOptions, setQuantityOptions] = useState([]);
  
  // Fetch item details
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${url}/api/item/${itemId}`);
        
        if (response.data.success) {
          setProduct(response.data.data);
          
          // Generate quantity options based on product properties
          if (response.data.data.is_loose) {
            // For loose items, generate options based on min order and increment
            const min = parseFloat(response.data.data.min_order_quantity);
            const step = parseFloat(response.data.data.increment_step);
            const max = Math.min(parseFloat(response.data.data.stock_quantity), 1000);
            
            let currentQty = min;
            const options = [];
            
            while (currentQty <= max) {
              options.push({
                value: currentQty,
                label: `${currentQty} ${response.data.data.unit}`
              });
              currentQty += step;
            }
            
            setQuantityOptions(options);
          } else {
            // For non-loose items, generate whole number options
            const max = Math.min(parseInt(response.data.data.stock_quantity), 100);
            const options = Array.from({ length: max }, (_, i) => ({
              value: i + 1,
              label: `${i + 1} ${response.data.data.unit}`
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
    
    fetchItemDetails();
  }, [url, itemId]);
  
  // Handle quantity change
  const handleQuantityChange = (e) => {
    setQuantity(parseFloat(e.target.value));
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return;
    
    try {
      // If the product is already in cart, we need to remove it first to set the exact quantity
      if (cartItems[product.id]) {
        removeFromCart(product.id);
      }
      
      // Custom add with specific quantity
      const addWithQuantity = async () => {
        try {
          const response = await axios.post(
            `${url}/api/cart/add`,
            { 
              item_id: product.id,
              quantity: quantity
            },
            { 
              headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              } 
            }
          );
          
          if (response.data.success) {
            toast.success(`Added ${quantity} ${product.unit} of ${product.name} to cart!`);
            // Update local cart context
            addToCart(product.id);
          } else {
            toast.error(response.data.message || 'Failed to add to cart');
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Error adding to cart');
        }
      };
      
      addWithQuantity();
    } catch (err) {
      toast.error('Failed to add item to cart');
    }
  };
  
  if (loading) {
    return <div className="product-detail-loading">Loading product details...</div>;
  }
  
  if (error) {
    return <div className="product-detail-error">{error}</div>;
  }
  
  if (!product) {
    return <div className="product-detail-error">Product not found</div>;
  }
  
  return (
    <div className="product-detail-container">
      <div className="product-detail-navigation">
        <button className="back-button" onClick={() => navigate(-1)}>
          &larr; Back to Products
        </button>
      </div>
      
      <div className="product-detail-content">
        <div className="product-detail-image">
          <img src={product.image} alt={product.name} />
        </div>
        
        <div className="product-detail-info">
          <h1 className="product-name">{product.name}</h1>
          
          <div className="product-meta">
            <span className="product-category">{product.category}</span>
            {product.weight_value && (
              <span className="product-weight">
                {product.weight_value}{product.weight_unit}
              </span>
            )}
          </div>
          
          <div className="product-price">
            LKR {parseFloat(product.selling_price || product.cost_price).toFixed(2)}
          </div>
          
          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description || 'No description available for this product.'}</p>
          </div>
          
          <div className="product-actions">
            <div className="quantity-selector">
              <label htmlFor="quantity">Quantity:</label>
              <select 
                id="quantity" 
                value={quantity}
                onChange={handleQuantityChange}
              >
                {quantityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              className="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
            >
              {product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
          
          <div className="product-stock-info">
            <span className={`stock-status ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
              {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
            
            {product.is_loose && (
              <div className="ordering-info">
                <p>Minimum order: {product.min_order_quantity} {product.unit}</p>
                <p>Increments: {product.increment_step} {product.unit}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Reviews Section */}
      <div className="product-reviews-container">
  {error ? (
    <div className="review-error-message">
      <h3>Reviews Unavailable</h3>
      <p>Sorry, we could not load the reviews for this product.</p>
    </div>
  ) : (
    <React.Suspense fallback={<div>Loading reviews...</div>}>
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
  )}
</div>
    </div>
  );
};

export default ProductDetail;