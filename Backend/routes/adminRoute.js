import express from "express";
import { adminLogin, createEmployee, createAdmin, getAllEmployees, updateEmployee, deleteEmployee, getDashboardData, getReports } from "../controllers/adminController.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";
import { Admin } from "../models/adminModel.js";

const router = express.Router();

// Public routes
router.post("/login", adminLogin);

// Protected routes - any admin role
router.get("/profile", authMiddleware, adminMiddleware(), async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }
    
    res.json({
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        firstName: admin.first_name,
        lastName: admin.last_name,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Protected routes - owner only
router.post("/employees", authMiddleware, adminMiddleware("owner"), createEmployee);
router.post("/admins", authMiddleware, adminMiddleware("owner"), createAdmin);
router.get("/employees", authMiddleware, adminMiddleware("owner"), getAllEmployees);
router.put("/employees/:id", authMiddleware, adminMiddleware("owner"), updateEmployee);
router.delete("/employees/:id", authMiddleware, adminMiddleware("owner"), deleteEmployee);
router.get("/dashboard", authMiddleware, adminMiddleware(), getDashboardData);
router.get("/reports/:type", authMiddleware, adminMiddleware(), getReports);

export default router;