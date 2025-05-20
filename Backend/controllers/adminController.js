import db from "../config/db.js"; 
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import { Admin } from "../models/adminModel.js";
import { Order } from "../models/orderModel.js";

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

// Create new admin account
const createAdmin = async (req, res) => {
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

    // Create new admin account
    const adminId = await Admin.createAdmin(username, email, hashedPassword, firstName, lastName);

    // Return success response
    res.status(201).json({ 
      success: true, 
      message: "Admin account created successfully",
      user: {
        id: adminId,
        username,
        firstName,
        lastName,
        email,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Create new employee account
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

    // Check if employee already exists
    const existingEmployee = await Admin.findByEmail(email);
    if (existingEmployee) {
      return res.status(400).json({ 
        success: false, 
        message: "Email already in use" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new employee account
    const employeeId = await Admin.createEmployee(username, email, hashedPassword, firstName, lastName);

    // Return success response
    res.status(201).json({ 
      success: true, 
      message: "Employee account created successfully",
      user: {
        id: employeeId,
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

const getDashboardData = async (req, res) => {
  try {
    const range = req.query.range || 'week';
    
    // Get order stats
    const orderStats = await Order.getStats();
    
    // Get low stock items
    const [lowStockItems] = await db.query(`
      SELECT 
        i.id, i.name, i.category, i.image, i.stock_quantity, i.unit, i.reorder_level
      FROM 
        items i
      WHERE 
        i.stock_quantity <= i.reorder_level AND
        i.disabled = FALSE
      ORDER BY 
        i.stock_quantity ASC
      LIMIT 10
    `);
    
    // Get out of stock items
    const [outOfStockItems] = await db.query(`
      SELECT 
        i.id, i.name, i.category, i.image, i.stock_quantity, i.unit, i.reorder_level
      FROM 
        items i
      WHERE 
        i.stock_quantity = 0 AND
        i.disabled = FALSE
      LIMIT 10
    `);
    
    // Get recent orders
    const [recentOrders] = await db.query(`
      SELECT 
        o.id, o.amount, o.status, o.payment, o.first_name, o.last_name, o.created_at,
        COUNT(oi.id) as item_count
      FROM 
        orders o
      LEFT JOIN 
        order_items oi ON o.id = oi.order_id
      WHERE 
        o.status != 'cart'
      GROUP BY 
        o.id
      ORDER BY 
        o.created_at DESC
      LIMIT 5
    `);
    
    // Get top selling products
    const [topProducts] = await db.query(`
      SELECT 
        i.id, i.name, i.category, i.image, i.unit,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.quantity * oi.price) as total_revenue
      FROM 
        items i
      JOIN 
        order_items oi ON i.id = oi.item_id
      JOIN 
        orders o ON oi.order_id = o.id
      WHERE 
        o.status != 'cart'
      GROUP BY 
        i.id
      ORDER BY 
        quantity_sold DESC
      LIMIT 8
    `);
    
    // Get sales data for chart
    let timeFrame;
    let groupBy;
    
    if (range === 'week') {
      timeFrame = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
      groupBy = 'DATE(o.created_at)';
    } else if (range === 'month') {
      timeFrame = 'DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      groupBy = 'DATE(o.created_at)';
    } else if (range === 'year') {
      timeFrame = 'DATE_SUB(CURDATE(), INTERVAL 12 MONTH)';
      groupBy = 'DATE_FORMAT(o.created_at, "%Y-%m")';
    }
    
    const [salesData] = await db.query(`
      SELECT 
        ${groupBy} as date,
        COUNT(DISTINCT o.id) as orders,
        SUM(o.amount) as revenue
      FROM 
        orders o
      WHERE 
        o.status != 'cart' AND
        o.created_at >= ${timeFrame}
      GROUP BY 
        ${groupBy}
      ORDER BY 
        date
    `);
    
    // Calculate total revenue and average order value
    const totalRevenue = salesData.reduce((sum, day) => sum + parseFloat(day.revenue), 0);
    const totalOrders = orderStats.totalOrders;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate revenue change percentage (comparing to previous period)
    let revenueChange = 0;
    
    if (range === 'week' || range === 'month') {
      const previousTimeFrame = range === 'week' 
        ? 'DATE_SUB(CURDATE(), INTERVAL 14 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
        : 'DATE_SUB(CURDATE(), INTERVAL 60 DAY) AND DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      
      const [previousPeriod] = await db.query(`
        SELECT 
          SUM(o.amount) as revenue
        FROM 
          orders o
        WHERE 
          o.status != 'cart' AND
          o.created_at BETWEEN ${previousTimeFrame}
      `);
      
      const previousRevenue = parseFloat(previousPeriod[0]?.revenue || 0);
      
      if (previousRevenue > 0) {
        revenueChange = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
      }
    }
    
    res.json({
      success: true,
      data: {
        totalRevenue,
        revenueChange,
        totalOrders,
        processingOrders: orderStats.pendingOrders,
        averageOrderValue,
        lowStockItems,
        outOfStockItems,
        recentOrders,
        topProducts,
        salesData
      }
    });
    
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving dashboard data",
      error: error.message
    });
  }
};

// Add this to your existing getReports function
const getReports = async (req, res) => {
  try {
    const { type } = req.params;
    const range = req.query.range || 'week';
    
    let data = [];
    let summary = {};
    
    if (type === 'sales') {
      // Time frame based on range
      let timeFrame;
      let groupBy;
      
      if (range === 'week') {
        timeFrame = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        groupBy = 'DATE(o.created_at)';
        summary.period = 'Last 7 days';
      } else if (range === 'month') {
        timeFrame = 'DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        groupBy = 'DATE(o.created_at)';
        summary.period = 'Last 30 days';
      } else if (range === 'quarter') {
        timeFrame = 'DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
        groupBy = 'DATE_FORMAT(o.created_at, "%Y-%m-%d")';
        summary.period = 'Last 90 days';
      } else if (range === 'year') {
        timeFrame = 'DATE_SUB(CURDATE(), INTERVAL 12 MONTH)';
        groupBy = 'DATE_FORMAT(o.created_at, "%Y-%m")';
        summary.period = 'Last 12 months';
      }
      
      // Get sales data with profit calculation
      const [salesData] = await db.query(`
        SELECT 
          ${groupBy} as date,
          COUNT(DISTINCT o.id) as orders,
          SUM(o.amount) as revenue,
          SUM(oi.quantity * i.cost_price) as total_cost,
          SUM(oi.quantity * oi.price) - SUM(oi.quantity * i.cost_price) as profit,
          CASE WHEN SUM(oi.quantity * i.cost_price) > 0 
               THEN (SUM(oi.quantity * oi.price) - SUM(oi.quantity * i.cost_price)) / SUM(oi.quantity * i.cost_price) * 100
               ELSE 0 
          END as profit_margin
        FROM 
          orders o
        JOIN 
          order_items oi ON o.id = oi.order_id
        JOIN 
          items i ON oi.item_id = i.id
        WHERE 
          o.status != 'cart' AND
          o.created_at >= ${timeFrame}
        GROUP BY 
          ${groupBy}
        ORDER BY 
          date
      `);
      
      // Add summary data
      const totalRevenue = salesData.reduce((sum, day) => sum + parseFloat(day.revenue || 0), 0);
      const totalProfit = salesData.reduce((sum, day) => sum + parseFloat(day.profit || 0), 0);
      const totalCost = salesData.reduce((sum, day) => sum + parseFloat(day.total_cost || 0), 0);
      const totalOrders = salesData.reduce((sum, day) => sum + parseInt(day.orders || 0), 0);
      
      summary.totalOrders = totalOrders;
      summary.totalRevenue = `LKR ${totalRevenue.toFixed(2)}`;
      summary.totalCost = `LKR ${totalCost.toFixed(2)}`;
      summary.totalProfit = `LKR ${totalProfit.toFixed(2)}`;
      summary.avgProfitMargin = `${totalCost > 0 ? (totalProfit / totalCost * 100).toFixed(2) : 0}%`;
      summary.avgOrderValue = `LKR ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0}`;
      
      data = salesData;
      
      // Also get category sales data for the same period
      const [categorySales] = await db.query(`
        SELECT 
          i.category,
          COUNT(DISTINCT o.id) as order_count,
          SUM(oi.quantity) as quantity_sold,
          SUM(oi.quantity * oi.price) as revenue,
          SUM(oi.quantity * i.cost_price) as cost,
          SUM(oi.quantity * oi.price) - SUM(oi.quantity * i.cost_price) as profit,
          CASE WHEN SUM(oi.quantity * i.cost_price) > 0 
               THEN (SUM(oi.quantity * oi.price) - SUM(oi.quantity * i.cost_price)) / SUM(oi.quantity * i.cost_price) * 100
               ELSE 0 
          END as profit_margin
        FROM 
          items i
        JOIN 
          order_items oi ON i.id = oi.item_id
        JOIN 
          orders o ON oi.order_id = o.id
        WHERE 
          o.status != 'cart' AND
          o.created_at >= ${timeFrame}
        GROUP BY 
          i.category
        ORDER BY 
          revenue DESC
      `);
      
      return res.json({
        success: true,
        data,
        categorySales,
        summary
      });
    }
    
    else if (type === 'inventory') {
      // Get low and out of stock items
      const [lowStockItems] = await db.query(`
        SELECT 
          i.id, i.name, i.category, i.stock_quantity, i.unit, i.reorder_level,
          i.cost_price, i.selling_price,
          (i.selling_price - i.cost_price) as profit_per_unit,
          CASE WHEN i.cost_price > 0 
               THEN ((i.selling_price - i.cost_price) / i.cost_price) * 100
               ELSE 0 
          END as profit_margin,
          CASE WHEN i.stock_quantity = 0 THEN 'Out of Stock' ELSE 'Low Stock' END as status
        FROM 
          items i
        WHERE 
          i.stock_quantity <= i.reorder_level AND
          i.disabled = FALSE
        ORDER BY 
          i.stock_quantity ASC
      `);
      
      // Category distribution of low stock items
      const categoryCount = {};
      lowStockItems.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      });
      
      // Add summary data
      summary.totalLowStockItems = lowStockItems.length;
      summary.outOfStockItems = lowStockItems.filter(item => item.stock_quantity === 0).length;
      summary.criticallyLowItems = lowStockItems.filter(item => item.stock_quantity > 0 && item.stock_quantity <= item.reorder_level / 2).length;
      summary.categoryCounts = Object.entries(categoryCount)
        .map(([category, count]) => `${category}: ${count}`)
        .join(', ');
      
      data = lowStockItems;
      
      return res.json({
        success: true,
        data,
        summary
      });
    }
    
    else if (type === 'products') {
      // Time filter based on range
      let timeFilter = '';
      
      if (range === 'week') {
        timeFilter = 'AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        summary.period = 'Last 7 days';
      } else if (range === 'month') {
        timeFilter = 'AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        summary.period = 'Last 30 days';
      } else if (range === 'quarter') {
        timeFilter = 'AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
        summary.period = 'Last 90 days';
      } else if (range === 'year') {
        timeFilter = 'AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)';
        summary.period = 'Last 12 months';
      }
      
      // Get top selling products with profitability
      const [topProducts] = await db.query(`
        SELECT 
          i.id, i.name, i.category, i.unit,
          SUM(oi.quantity) as quantity_sold,
          SUM(oi.quantity * oi.price) as total_revenue,
          SUM(oi.quantity * i.cost_price) as total_cost,
          SUM(oi.quantity * oi.price) - SUM(oi.quantity * i.cost_price) as total_profit,
          CASE WHEN SUM(oi.quantity * i.cost_price) > 0 
               THEN (SUM(oi.quantity * oi.price) - SUM(oi.quantity * i.cost_price)) / SUM(oi.quantity * i.cost_price) * 100
               ELSE 0 
          END as profit_margin
        FROM 
          items i
        JOIN 
          order_items oi ON i.id = oi.item_id
        JOIN 
          orders o ON oi.order_id = o.id
        WHERE 
          o.status != 'cart'
          ${timeFilter}
        GROUP BY 
          i.id
        ORDER BY 
          quantity_sold DESC
        LIMIT 50
      `);
      
      // Add summary data
      const totalRevenue = topProducts.reduce((sum, product) => sum + parseFloat(product.total_revenue || 0), 0);
      const totalProfit = topProducts.reduce((sum, product) => sum + parseFloat(product.total_profit || 0), 0);
      const totalItems = topProducts.reduce((sum, product) => sum + parseInt(product.quantity_sold || 0), 0);
      
      summary.totalProductsSold = totalItems;
      summary.totalRevenue = `LKR ${totalRevenue.toFixed(2)}`;
      summary.totalProfit = `LKR ${totalProfit.toFixed(2)}`;
      summary.avgProfitMargin = `${totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(2) : 0}%`;
      
      // Get category distribution
      const categoryData = {};
      topProducts.forEach(product => {
        if (!categoryData[product.category]) {
          categoryData[product.category] = {
            quantity: 0,
            revenue: 0,
            profit: 0
          };
        }
        
        categoryData[product.category].quantity += parseInt(product.quantity_sold || 0);
        categoryData[product.category].revenue += parseFloat(product.total_revenue || 0);
        categoryData[product.category].profit += parseFloat(product.total_profit || 0);
      });
      
      const categoryResults = Object.entries(categoryData).map(([category, data]) => ({
        category,
        quantity_sold: data.quantity,
        total_revenue: data.revenue,
        total_profit: data.profit,
        profit_margin: data.revenue > 0 ? (data.profit / data.revenue * 100) : 0
      }));
      
      data = topProducts;
      
      return res.json({
        success: true,
        data,
        categorySales: categoryResults,
        summary
      });
    }
    
    res.json({
      success: true,
      data,
      summary
    });
    
  } catch (error) {
    console.error(`Error generating ${req.params.type} report:`, error);
    res.status(500).json({
      success: false,
      message: "Error generating report",
      error: error.message
    });
  }
};

// Add this to the exports
export { adminLogin, createEmployee, createAdmin, getAllEmployees, updateEmployee, deleteEmployee, getDashboardData, getReports };