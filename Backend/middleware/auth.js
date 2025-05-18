import jwt from "jsonwebtoken";
import { Admin } from "../models/adminModel.js";
import { User } from "../models/userModel.js";

// Update your auth middleware to better handle token issues:
const authMiddleware = (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. No token provided."
      });
    }
    
    // Check for proper format: "Bearer [token]"
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format. Use format: 'Bearer [token]'"
      });
    }
    
    // Extract the token from the header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Token is empty."
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to the request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token."
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired."
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Authentication error."
    });
  }
};

export default authMiddleware;