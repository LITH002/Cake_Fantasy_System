import jwt from 'jsonwebtoken';
import 'dotenv/config';

const authMiddleware = (req, res, next) => {
  try {
    // Get token from various possible places
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = req.body.token || 
                 req.query.token || 
                 req.headers.token ||
                 (authHeader && authHeader.startsWith('Bearer ') 
                   ? authHeader.split(' ')[1] 
                   : authHeader);
    
    console.log("Auth middleware processing token:", token ? 'present' : 'missing');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Access denied. No token provided" 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user data to request
    req.user = decoded;
    console.log("User authenticated:", req.user.id);
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ 
      success: false, 
      message: "Invalid token"
    });
  }
};

export default authMiddleware;