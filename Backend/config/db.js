import mysql from 'mysql2/promise';
import 'dotenv/config';

// Add detailed error logging
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'cake_fantasy_db',
  waitForConnections: true,
  connectionLimit: 20, // Increase connection limit
  queueLimit: 0,
  debug: process.env.NODE_ENV === 'development' // Enable SQL debugging in dev
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log(`Connected to MySQL database: ${process.env.DB_NAME}`);
    // Test basic query
    return connection.query('SELECT 1+1 AS result')
      .then(([rows]) => {
        console.log('Database query test successful:', rows[0].result);
        connection.release();
      });
  })
  .catch(err => {
    console.error('Database connection error:', err);
    console.error('Database config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
  });

export default pool;