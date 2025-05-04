import express from "express";
import { addItem, listItem, removeItem } from "../controllers/itemController.js"; 
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const itemRouter = express.Router();

// Convert fs methods to promise-based
const existsAsync = promisify(fs.exists);
const mkdirAsync = promisify(fs.mkdir);

// Async initialization of uploads directory
const initUploadsDir = async () => {
  try {
    const uploadDir = "uploads";
    const dirExists = await existsAsync(uploadDir);
    
    if (!dirExists) {
      await mkdirAsync(uploadDir, { recursive: true });
      console.log("Uploads directory created");
    }
  } catch (err) {
    console.error("Error initializing uploads directory:", err);
    process.exit(1); // Critical failure - exit if we can't create uploads dir
  }
};

// Initialize uploads directory when server starts
initUploadsDir();

// Image Storage Engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter and limits
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

// Define API routes
itemRouter.post("/add", 
  upload.single("image"), 
  handleUploadErrors, 
  addItem
);

itemRouter.get("/list", listItem);

// Changed to DELETE method (more semantically correct)
itemRouter.post("/remove", removeItem); 

export default itemRouter;