import db from "../config/db.js";

const createItemTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      description TEXT,
      sku VARCHAR(50) UNIQUE NOT NULL,
      barcode VARCHAR(50) UNIQUE,
      unit VARCHAR(20) DEFAULT 'piece',
      is_loose BOOLEAN DEFAULT FALSE,
      min_order_quantity DECIMAL(10,3) DEFAULT 1,
      increment_step DECIMAL(10,3) DEFAULT 1,
      weight_value DECIMAL(10,3) DEFAULT NULL,
      weight_unit ENUM('g', 'ml') DEFAULT NULL,
      pieces_per_pack INT DEFAULT NULL,
      cost_price DECIMAL(10,2) DEFAULT 0,
      selling_price DECIMAL(10,2) DEFAULT 0,
      stock_quantity DECIMAL(10,3) DEFAULT 0,
      image VARCHAR(255) COMMENT 'Cloudinary URL',
      cloudinary_id VARCHAR(255) COMMENT 'Cloudinary public ID for image management',
      disabled BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );`;

await db.query(sql);
};

// Helper function to generate SKU
export const generateSKU = async (category, customSKU = null) => {
  // If custom SKU is provided and not already used, use it
  if (customSKU) {
    const [existing] = await db.query(
      "SELECT id FROM items WHERE sku = ? OR barcode = ? LIMIT 1", 
      [customSKU, customSKU]
    );
    
    if (existing.length === 0) {
      return customSKU;
    }
  }
  
  // Generate a SKU based on category and count
  // Get category prefix
  let prefix;
  switch(category.toLowerCase()) {
    case 'cake ingredients':
      prefix = 'ING';
      break;
    case 'cake tools':
      prefix = 'TOOL';
      break;
    case 'party items':
      prefix = 'PRTY';
      break;
    default:
      prefix = 'ITEM';
  }
  
  // Get count of items in this category
  const [results] = await db.query(
    "SELECT COUNT(*) as count FROM items WHERE category = ?",
    [category]
  );
  
  const count = results[0].count + 1;
  const timestamp = Date.now().toString().slice(-6);
  
  // Format: PREFIX-COUNT-TIMESTAMP
  return `${prefix}-${count.toString().padStart(3, '0')}-${timestamp}`;
};

export default createItemTable;