import express from 'express';
import { getItemReviews, submitReview } from '../controllers/reviewController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get reviews for an item
router.get('/item/:itemId', getItemReviews);

// Submit a review (requires authentication)
router.post('/submit', authMiddleware, submitReview);

export default router;