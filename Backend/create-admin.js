// Direct admin user creation script
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import 'dotenv/config';

async function createAdminUser() {
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
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);
    
    // Create admin account with 'test@test.com' credentials
    const [result] = await connection.query(
      'INSERT INTO admin_users (username, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['testadmin', 'test@test.com', hashedPassword, 'Test', 'Admin', 'owner']
    );
    
    console.log('Created test admin account with ID:', result.insertId);
    console.log('Login credentials: test@test.com / test123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the function
createAdminUser();
