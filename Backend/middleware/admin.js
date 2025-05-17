/**
 * Middleware to enforce admin role requirements
 * @param {string} requiredRole - 'employee' or 'owner' (default: any admin role)
 */
const adminMiddleware = (requiredRole = null) => (req, res, next) => {
  try {
    // Check if user object exists (set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    // Check if the token is for an admin user
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admin access required"
      });
    }
    
    // If a specific role is required, check for it
    if (requiredRole && requiredRole === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: "Owner privileges required"
      });
    }
    
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

export default adminMiddleware;