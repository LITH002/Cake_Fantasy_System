import './Items.css'
import assets from '../../assets/assets'
import { useContext } from 'react'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom'

// eslint-disable-next-line react/prop-types
const Items = ({ id, name, price, image, unit, category, weight_value, weight_unit, rating = 0 }) => {
  const navigate = useNavigate();
  const {cartItems, addToCart, removeFromCart} = useContext(StoreContext);

  const handleViewDetails = () => {
    navigate(`/product/${id}`);
    window.scrollTo(0, 0);
  };
  
  // Format price to show decimal places only if needed
  const formatPrice = (price) => {
    if (!price || isNaN(price)) return '0.00';
    const numPrice = parseFloat(price);
    return numPrice % 1 === 0 ? numPrice.toFixed(0) : numPrice.toFixed(2);
  };

  // Generate star rating display
  const renderStars = (rating, count = 0) => {
    const stars = [];
    // Convert rating to number and ensure it's within 0-5 range
    const ratingValue = Math.min(5, Math.max(0, parseFloat(rating) || 0));
    
    for (let i = 1; i <= 5; i++) {
      // For full stars
      if (i <= Math.floor(ratingValue)) {
        stars.push(<span key={i} className="star full">★</span>);
      } 
      // For half stars (when the decimal part is 0.5 or greater)
      else if (i === Math.ceil(ratingValue) && ratingValue % 1 >= 0.5) {
        stars.push(<span key={i} className="star half">★</span>);
      } 
      // For empty stars
      else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    
    return (
      <div className="star-rating">
        {stars}
        {count > 0 && <span className="rating-count">({count})</span>}
      </div>
    );
  };
  
  return (
    <div className='item'>
      <div className="item-image-container">
        <img className='item-image' src={image} alt={name}/>
        <div className="item-actions">
          <button className="view-details-btn" onClick={handleViewDetails}>
            View Details
          </button>
        </div>
      </div>
      <div className="item-info">
        <div className="item-name-rating">
          <p className="item-name">{name}</p>
          <div className="item-badges">
            {category && <span className="item-category-badge">{category}</span>}
            {weight_value && <span className="item-weight-badge">{weight_value}{weight_unit}</span>}
          </div>
        </div>
        
        {/* Star rating instead of description */}
        {renderStars(rating)}
        
        <div className="item-price-container">
          <p className="item-price">LKR {formatPrice(price)}</p>
          {unit && <span className="item-unit">per {unit}</span>}
        </div>
      </div>    
    </div>
  )
}

export default Items