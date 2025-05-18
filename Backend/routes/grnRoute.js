import express from 'express';
import { 
  createGRN, 
  completeGRN, 
  getGRNById, 
  listGRNs, 
  cancelGRN
} from '../controllers/grnController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';

const router = express.Router();

// Basic test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: "GRN routes are working"
  });
});

// Protected routes
// All GRN routes require authentication and admin privileges
router.use(authMiddleware, adminMiddleware());

// CRITICAL: Specific routes must come BEFORE wildcard routes
router.get('/list', listGRNs);  // Must be BEFORE /:id route!

// Create new GRN
router.post('/create', createGRN);

// Complete GRN
router.post('/:id/complete', completeGRN);

// Cancel GRN
router.post('/:id/cancel', cancelGRN);

// Get GRN by ID 
router.get('/:id', getGRNById); 

export default router;