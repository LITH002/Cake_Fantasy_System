import db from '../config/db.js';
import bcrypt from 'bcrypt';

// Create admin_users table
const createAdminTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role ENUM('employee', 'owner') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  try {
    await db.query(sql);
    console.log("Admin users table created successfully");
    
    // Check if there's at least one owner account
    const [owners] = await db.query("SELECT COUNT(*) as count FROM admin_users WHERE role = 'owner'");
    
    // If no owner exists, create a default one
    if (owners[0].count === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("adminpassword", salt);
      
      await db.query(
        "INSERT INTO admin_users (username, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)",
        ["admin", "admin@cakefantasy.com", hashedPassword, "Admin", "User", "owner"]
      );
      console.log("Default admin owner account created");
    }
  } catch (err) {
    console.error("Error creating admin_users table:", err);
    throw err;
  }
};

// Admin User model
const Admin = {
  findByEmail: async (email) => {
    try {
      const [rows] = await db.query(
        "SELECT * FROM admin_users WHERE email = ?",
        [email]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  findById: async (id) => {
    try {
      const [rows] = await db.query(
        "SELECT id, username, email, first_name, last_name, role FROM admin_users WHERE id = ?",
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },
  
  createEmployee: async (username, email, password, firstName, lastName) => {
    try {
      const [result] = await db.query(
        "INSERT INTO admin_users (username, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, 'employee')",
        [username, email, password, firstName, lastName]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  },
  
  getAllEmployees: async () => {
    try {
      const [rows] = await db.query(
        "SELECT id, username, email, first_name, last_name, role, created_at FROM admin_users WHERE role = 'employee'"
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },
  
  updateAdmin: async (id, data) => {
    try {
      const { username, email, firstName, lastName } = data;
      
      const [result] = await db.query(
        "UPDATE admin_users SET username = ?, email = ?, first_name = ?, last_name = ? WHERE id = ?",
        [username, email, firstName, lastName, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },
  
  updatePassword: async (id, newPassword) => {
    try {
      const [result] = await db.query(
        "UPDATE admin_users SET password = ? WHERE id = ?",
        [newPassword, id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  },
  
  deleteAdmin: async (id) => {
    try {
      const [result] = await db.query(
        "DELETE FROM admin_users WHERE id = ? AND role = 'employee'", // Only employees can be deleted
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
};

export { createAdminTable, Admin };