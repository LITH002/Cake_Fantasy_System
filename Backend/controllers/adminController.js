import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import { Admin } from "../models/adminModel.js";

// Create JWT token specifically for admin users
const createAdminToken = (id, role) => {
  return jwt.sign({ id, role, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Admin login controller
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email" 
      });
    }

    // Find admin by email
    const admin = await Admin.findByEmail(email);
    
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Generate admin token with role
    const token = createAdminToken(admin.id, admin.role);

    // Return success response with admin data
    res.status(200).json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        firstName: admin.first_name,
        lastName: admin.last_name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Create new admin account (employee only)
const createEmployee = async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;

  try {
    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a valid email" 
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 8 characters long" 
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already in use" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new employee account
    const adminId = await Admin.createEmployee(username, email, hashedPassword, firstName, lastName);

    // Return success response
    res.status(201).json({ 
      success: true, 
      message: "Employee account created successfully",
      user: {
        id: adminId,
        username,
        firstName,
        lastName,
        email,
        role: 'employee'
      }
    });

  } catch (error) {
    console.error("Create employee error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get all employees (for owner)
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Admin.getAllEmployees();
    
    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { username, email, firstName, lastName } = req.body;
  
  try {
    // Validate required fields
    if (!username || !email || !firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Check if employee exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    
    // Only owners can update owners, employees can only be updated by owners
    if (admin.role === 'owner' && req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
    }
    
    // Update employee
    const updated = await Admin.updateAdmin(id, { username, email, firstName, lastName });
    
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "Failed to update employee"
      });
    }
    
    res.json({
      success: true,
      message: "Employee updated successfully"
    });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if employee exists
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    
    // Only owners can delete employees
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
    }
    
    // Can't delete owners
    if (admin.role === 'owner') {
      return res.status(403).json({
        success: false,
        message: "Cannot delete owner accounts"
      });
    }
    
    // Delete employee
    const deleted = await Admin.deleteAdmin(id);
    
    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: "Failed to delete employee"
      });
    }
    
    res.json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

export { adminLogin, createEmployee, getAllEmployees, updateEmployee, deleteEmployee };