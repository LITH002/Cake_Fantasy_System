import express from "express";
import { addItem, getItem, listItem, removeItem, updateItem, generateBarcode } from "../controllers/itemController.js"; 
import multer from "multer";
import connectCloudinary from "../config/cloudinary.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";

const itemRouter = express.Router();

// Initialize Cloudinary
connectCloudinary();

// Configure multer for memory storage instead of disk storage
// This allows us to get the buffer to upload to Cloudinary
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only 1 file
  }
});

// Error handling middleware for file uploads
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      success: false,
      message: err.code === "LIMIT_FILE_SIZE" 
        ? "File too large (max 5MB)" 
        : "File upload error"
    });
  } else if (err) {
    return res.status(400).json({ 
      success: false,
      message: err.message || "Invalid file upload"
    });
  }
  next();
};

// API routes
// Public routes
itemRouter.get("/list", listItem);
itemRouter.get("/:id", getItem);

// Admin-only routes (protected)
itemRouter.use(authMiddleware, adminMiddleware());
itemRouter.post("/add", upload.single("image"), handleUploadErrors, addItem);
itemRouter.post("/update", upload.single("image"), handleUploadErrors, updateItem);
itemRouter.post("/remove", removeItem); 
itemRouter.get("/barcode/:item_id", generateBarcode);

export default itemRouter;