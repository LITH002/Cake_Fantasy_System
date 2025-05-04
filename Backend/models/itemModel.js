import db from "../config/db.js";

const createItemTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      image VARCHAR(255)
    );
  `;

  try {
    await db.query(sql);
    console.log("Items table created successfully");
  } catch (err) {
    console.error("Error creating items table:", err);
    throw err; // Re-throw to handle in server.js
  }
};

export default createItemTable;