/**
 * Middleware to enforce admin role requirements
 * @param {string} requiredRole - 'employee', 'admin', or 'owner' (default: any admin role)
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
    
    // If a specific role is required, check role hierarchy
    if (requiredRole) {
      const roleHierarchy = {
        'employee': 1,
        'admin': 2, 
        'owner': 3
      };

      const userRoleLevel = roleHierarchy[req.user.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
      
      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          success: false,
          message: `${requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} privileges required`
        });
      }
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