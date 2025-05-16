import jwt from "jsonwebtoken";
import { Admin } from "../models/adminModel.js";
import { User } from "../models/userModel.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required"
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add basic user info to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      isAdmin: decoded.isAdmin || false
    };
    
    // For admin users, verify that they still exist in database
    if (req.user.isAdmin) {
      const admin = await Admin.findById(req.user.id);
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Admin account no longer exists"
        });
      }
    }
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      success: false,
      message: "Request is not authorized"
    });
  }
};

export default authMiddleware;