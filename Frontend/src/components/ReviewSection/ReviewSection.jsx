import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './ReviewSection.css';
import { StoreContext } from '../../context/StoreContext';
import StarRating from '../StarRating/StarRating';
import { toast } from 'react-toastify';

const ReviewSection = ({ itemId }) => {
  const { url } = useContext(StoreContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);
  const [userReview, setUserReview] = useState({
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUserReviewed, setHasUserReviewed] = useState(false);
  
  // Get token from localStorage
  const getToken = () => {
    try {
      return localStorage.getItem('token');
    } catch (e) {
      console.error("Error accessing localStorage:", e);
      return null;
    }
  };
  
  // Extract user ID from token - with error handling
  const getUserIdFromToken = () => {
    const token = getToken();
    if (!token) return null;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.id;
    } catch (err) {
      console.error('Error parsing token:', err);
      return null;
    }
  };
  
  // Fetch reviews for this item - with proper error handling
  useEffect(() => {
    const fetchReviews = async () => {
      if (!itemId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${url}/api/review/item/${itemId}`);
        
        if (response.data.success) {
          // Handle the case where reviews might be null or undefined
          const reviewsData = response.data.data.reviews || [];
          setReviews(reviewsData);
          setAverageRating(response.data.data.average_rating || 0);
          
          // Check if user has already reviewed this item
          const token = getToken();
          const userId = getUserIdFromToken();
          
          if (token && userId) {
            const userReview = reviewsData.find(
              review => review.user_id === userId
            );
            
            if (userReview) {
              setHasUserReviewed(true);
              setUserReview({
                rating: userReview.rating || 5,
                comment: userReview.comment || ''
              });
            }
          }
        } else {
          setError(response.data.message || "Failed to load reviews");
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError("Error loading reviews. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [url, itemId]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserReview(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle rating change
  const handleRatingChange = (newRating) => {
    setUserReview(prev => ({
      ...prev,
      rating: newRating
    }));
  };
  
  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    const token = getToken();
    if (!token) {
      toast.info('Please log in to submit a review');
      return;
    }
    
    if (!userReview.comment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await axios.post(
        `${url}/api/review/submit`,
        {
          item_id: itemId,
          rating: userReview.rating,
          comment: userReview.comment
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Review submitted successfully!');
        
        // Update the reviews list
        const newReview = response.data.data;
        
        if (hasUserReviewed) {
          // Update existing review
          setReviews(prevReviews => prevReviews.map(review => 
            review.user_id === getUserIdFromToken() ? newReview : review
          ));
        } else {
          // Add new review
          setReviews(prevReviews => [newReview, ...prevReviews]);
          setHasUserReviewed(true);
        }
        
        // Recalculate average rating
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0) + 
                             (hasUserReviewed ? 0 : newReview.rating);
          const newAverage = hasUserReviewed 
            ? totalRating / reviews.length
            : totalRating / (reviews.length + 1);
          
          setAverageRating(newAverage);
        } else {
          setAverageRating(newReview.rating);
        }
      } else {
        toast.error(response.data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setError("Error submitting review. Please try again.");
      toast.error(err.response?.data?.message || 'Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If there's an error, show error message but don't crash
  if (error) {
    return (
      <div className="review-section">
        <h2>Customer Reviews</h2>
        <div className="review-error">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="reload-btn"
          >
            Reload Reviews
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="review-section">
      <h2>Customer Reviews</h2>
      
      <div className="review-summary">
        <div className="average-rating">
          <span className="rating-value">{Number(averageRating).toFixed(1)}</span>
          <StarRating 
            rating={averageRating} 
            size="large" 
            readOnly
          />
          <span className="review-count">
            ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>
      
      {/* Add/Edit Review Form */}
      <div className="review-form-container">
        <h3>{hasUserReviewed ? 'Edit Your Review' : 'Add a Review'}</h3>
        
        {!getToken() ? (
          <p className="login-prompt">
            Please <a href="/login">log in</a> to submit a review.
          </p>
        ) : (
          <form className="review-form" onSubmit={handleSubmitReview}>
            <div className="form-group">
              <label>Your Rating</label>
              <StarRating 
                rating={userReview.rating} 
                onChange={handleRatingChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="comment">Your Review</label>
              <textarea
                id="comment"
                name="comment"
                value={userReview.comment}
                onChange={handleInputChange}
                placeholder="Share your thoughts about this product..."
                rows="4"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-review-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : (hasUserReviewed ? 'Update Review' : 'Submit Review')}
            </button>
          </form>
        )}
      </div>
      
      {/* Reviews List */}
      <div className="reviews-list">
        <h3>All Reviews</h3>
        
        {loading ? (
          <p className="reviews-loading">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="no-reviews">Be the first to review this product!</p>
        ) : (
          reviews.map((review) => (
            <div className="review-item" key={review.id}>
              <div className="review-header">
                <span className="reviewer-name">{review.user_name || 'Anonymous'}</span>
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="review-rating">
                <StarRating rating={review.rating} size="small" readOnly />
              </div>
              
              <div className="review-comment">
                {review.comment}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;