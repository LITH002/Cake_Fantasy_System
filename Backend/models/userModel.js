import db from "../config/db.js";

// User Table Creation
export const createUserTable = async () => {
  const userTableSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.query(userTableSql);
    console.log("Users table created successfully");
  } catch (err) {
    console.error("Error creating users table:", err);
    throw err;
  }
};

// Cart Table Creation
export const createCartTable = async () => {
  const cartTableSql = `
    CREATE TABLE IF NOT EXISTS user_carts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      item_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      UNIQUE KEY (user_id, item_id)
    );
  `;

  try {
    await db.query(cartTableSql);
    console.log("Cart table created successfully");
  } catch (err) {
    console.error("Error creating cart table:", err);
    throw err;
  }
};

// User Operations
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
  },

  findById: async (id) => {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  }
};

// Cart Operations
export const Cart = {
  addItem: async (userId, itemId, quantity = 1) => {
    // Using INSERT ... ON DUPLICATE KEY UPDATE for atomic operation
    const [result] = await db.query(`
      INSERT INTO user_carts (user_id, item_id, quantity) 
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      quantity = quantity + VALUES(quantity)
    `, [userId, itemId, quantity]);
    
    return result.affectedRows > 0;
  },

  removeItem: async (userId, itemId) => {
    const [result] = await db.query(
      "DELETE FROM user_carts WHERE user_id = ? AND item_id = ?",
      [userId, itemId]
    );
    return result.affectedRows > 0;
  },

  updateQuantity: async (userId, itemId, quantity) => {
    const [result] = await db.query(
      "UPDATE user_carts SET quantity = ? WHERE user_id = ? AND item_id = ?",
      [quantity, userId, itemId]
    );
    return result.affectedRows > 0;
  },

  getCart: async (userId) => {
    const [items] = await db.query(`
      SELECT 
        uc.item_id AS id, 
        uc.quantity, 
        i.name, 
        i.price, 
        i.image, 
        i.category,
        (i.price * uc.quantity) AS total_price
      FROM user_carts uc
      JOIN items i ON uc.item_id = i.id
      WHERE uc.user_id = ?
    `, [userId]);
    
    return items;
  },

  clearCart: async (userId) => {
    const [result] = await db.query(
      "DELETE FROM user_carts WHERE user_id = ?",
      [userId]
    );
    return result.affectedRows > 0;
  }
};

// Initialize all tables
export const initializeTables = async () => {
  await createUserTable();
  await createCartTable();
};