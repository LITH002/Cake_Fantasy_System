import mysql from 'mysql2/promise'; // ← Change this import
import dotenv from 'dotenv';

dotenv.config();

// Create MySQL connection pool (better than single connection)
const db = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
db.getConnection()
  .then((connection) => {
    console.log("Connected to MySQL via XAMPP");
    connection.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

export default db;