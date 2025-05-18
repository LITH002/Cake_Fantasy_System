import express from 'express';
import { 
  createSupplier, 
  deleteSupplier, 
  getAllSuppliers, 
  getSupplierById, 
  updateSupplier,
  removeSupplier 
} from '../controllers/supplierController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';

const router = express.Router();

// All supplier routes are admin-only
router.use(authMiddleware, adminMiddleware());

// Get all suppliers
router.get('/list', getAllSuppliers);

// Create supplier
router.post('/add', createSupplier);

// Update supplier
router.post('/update', updateSupplier);

// Delete supplier (POST method with ID in body)
router.post('/remove', removeSupplier);

// Delete supplier (DELETE method)
router.delete('/:id', deleteSupplier);

// Get supplier by ID
router.get('/:id', getSupplierById);

export default router;