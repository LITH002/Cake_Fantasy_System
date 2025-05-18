import db from "../config/db.js";

const createItemTable = async () => {
  const sql = `
   CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      image VARCHAR(255) COMMENT 'Cloudinary URL',
      cloudinary_id VARCHAR(255) COMMENT 'Cloudinary public ID for image management',
      disabled BOOLEAN DEFAULT FALSE
    );`;
};

export default createItemTable;