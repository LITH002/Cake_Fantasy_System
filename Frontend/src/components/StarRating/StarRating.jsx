import { useState } from 'react';
import './StarRating.css';

const StarRating = ({ rating = 0, onChange, size = 'medium', readOnly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const handleMouseOver = (index) => {
    if (readOnly) return;
    setHoverRating(index);
  };
  
  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };
  
  const handleClick = (index) => {
    if (readOnly) return;
    onChange(index);
  };
  
  return (
    <div className={`star-rating ${size} ${readOnly ? 'read-only' : ''}`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <span
          key={index}
          className={`star ${
            index <= (hoverRating || rating) ? 'filled' : 'empty'
          }`}
          onMouseOver={() => handleMouseOver(index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(index)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;