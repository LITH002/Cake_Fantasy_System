// Database seeding script to create default users
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import 'dotenv/config';

async function seedDatabase() {
  let connection;
  try {
    // Create a connection to the database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'cake_fantasy_db'
    });
    
    console.log('Connected to database');
    
    // Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'cake_fantasy_db'}`);
    await connection.query(`USE ${process.env.DB_NAME || 'cake_fantasy_db'}`);
    
    // Create admin_users table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role ENUM('employee', 'admin', 'owner') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Check if there are any users in the admin_users table
    const [rows] = await connection.query('SELECT id, username, email, role FROM admin_users');
    
    console.log(`Found ${rows.length} admin users`);
    
    // Create default users if none exist
    if (rows.length === 0) {
      console.log('Creating default admin accounts...');
      
      // Hash passwords
      const salt = await bcrypt.genSalt(10);
      const ownerPassword = await bcrypt.hash('owner123', salt);
      const adminPassword = await bcrypt.hash('admin123', salt);
      const employeePassword = await bcrypt.hash('employee123', salt);
      
      // Create owner account
      const ownerInsert = await connection.query(
        'INSERT INTO admin_users (username, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['owner', 'owner@cakefantasy.com', ownerPassword, 'System', 'Owner', 'owner']
      );
      console.log('Created owner account');
      
      // Create admin account
      const adminInsert = await connection.query(
        'INSERT INTO admin_users (username, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin', 'admin@cakefantasy.com', adminPassword, 'System', 'Admin', 'admin']
      );
      console.log('Created admin account');
      
      // Create employee account
      const employeeInsert = await connection.query(
        'INSERT INTO admin_users (username, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
        ['employee', 'employee@cakefantasy.com', employeePassword, 'System', 'Employee', 'employee']
      );
      console.log('Created employee account');
      
      console.log('Default accounts created successfully!');
      console.log('Owner login: owner@cakefantasy.com / owner123');
      console.log('Admin login: admin@cakefantasy.com / admin123');
      console.log('Employee login: employee@cakefantasy.com / employee123');
    } else {
      console.log('Admin users already exist. Skipping default account creation.');
    }
    
  } catch (error) {
    console.error('Database seeding error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the seeding function
seedDatabase();
