import db from "../config/db.js";

export const createUserTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      cartData TEXT DEFAULT '{}'
    );
  `;

  try {
    await db.query(sql);
    console.log("Users table created successfully");
  } catch (err) {
    console.error("Error creating users table:", err);
    throw err;
  }
};

export const User = {
  findByEmail: async (email) => {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  },

  create: async (name, email, password) => {
    const [result] = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
      [name, email, password]
    );
    return result.insertId;
  }
};