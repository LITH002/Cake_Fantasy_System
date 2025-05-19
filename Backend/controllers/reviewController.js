import db from '../config/db.js';

// Get reviews for an item
export const getItemReviews = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // First, ensure the item exists
    const [itemResult] = await db.query(
      'SELECT id FROM items WHERE id = ?',
      [itemId]
    );
    
    if (itemResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Get the reviews for this item with user names
    // Using the 'name' column from users table
    const [reviews] = await db.query(`
      SELECT 
        r.id,
        r.user_id,
        u.name AS user_name, 
        r.rating,
        r.comment,
        r.created_at
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.item_id = ?
      ORDER BY r.created_at DESC
    `, [itemId]);
    
    // Calculate average rating
    const [avgResult] = await db.query(`
      SELECT AVG(rating) AS average_rating
      FROM reviews
      WHERE item_id = ?
    `, [itemId]);
    
    const averageRating = avgResult[0].average_rating || 0;
    
    res.json({
      success: true,
      data: {
        reviews,
        average_rating: averageRating
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Submit a review
export const submitReview = async (req, res) => {
  try {
    const { item_id, rating, comment } = req.body;
    const userId = req.user.id;
    
    if (!item_id || !rating || rating < 1 || rating > 5 || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review data. Rating must be between 1-5 and comment is required.'
      });
    }
    
    // Check if the item exists
    const [itemResult] = await db.query(
      'SELECT id FROM items WHERE id = ?',
      [item_id]
    );
    
    if (itemResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    // Check if user has already reviewed this item
    const [existingReview] = await db.query(
      'SELECT id FROM reviews WHERE user_id = ? AND item_id = ?',
      [userId, item_id]
    );
    
    let reviewId;
    
    if (existingReview.length > 0) {
      // Update existing review
      await db.query(`
        UPDATE reviews 
        SET rating = ?, comment = ?, updated_at = NOW()
        WHERE id = ?
      `, [rating, comment, existingReview[0].id]);
      
      reviewId = existingReview[0].id;
    } else {
      // Insert new review
      const [result] = await db.query(`
        INSERT INTO reviews (user_id, item_id, rating, comment)
        VALUES (?, ?, ?, ?)
      `, [userId, item_id, rating, comment]);
      
      reviewId = result.insertId;
    }
    
    // Get the updated review with user name
    const [updatedReview] = await db.query(`
      SELECT 
        r.id,
        r.user_id,
        u.name AS user_name,
        r.rating,
        r.comment,
        r.created_at
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [reviewId]);
    
    res.json({
      success: true,
      message: existingReview.length > 0 ? 'Review updated successfully' : 'Review submitted successfully',
      data: updatedReview[0]
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};