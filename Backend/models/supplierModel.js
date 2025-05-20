import db from "../config/db.js";

export const createSupplierTable = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS suppliers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact_person VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );`;
  
  await db.query(sql);
};

export const Supplier = {
  // Add these to your Supplier object
  findByName: async (name) => {
    const [rows] = await db.query(
      "SELECT * FROM suppliers WHERE name = ? LIMIT 1", 
      [name]
    );
    return rows[0] || null;
  },

  findByPhone: async (phone) => {
    // Remove non-digits for comparison
    const sanitizedPhone = phone.replace(/\D/g, '');
    
    // Get all suppliers
    const [suppliers] = await db.query("SELECT * FROM suppliers");
    
    // Find matching phone (comparing only digits)
    const match = suppliers.find(supplier => {
      const supplierPhone = supplier.phone.replace(/\D/g, '');
      return supplierPhone === sanitizedPhone;
    });
    
    return match || null;
  },

  findByEmail: async (email) => {
    const [rows] = await db.query(
      "SELECT * FROM suppliers WHERE email = ? LIMIT 1", 
      [email]
    );
    return rows[0] || null;
  },

  findAll: async (filters = {}) => {
    let query = "SELECT * FROM suppliers";
    const params = [];
    
    if (filters.active) {
      query += " WHERE is_active = TRUE";
    }
    
    query += " ORDER BY name ASC";
    
    const [suppliers] = await db.query(query, params);
    return suppliers;
  },
  
  findById: async (id) => {
    const [rows] = await db.query("SELECT * FROM suppliers WHERE id = ?", [id]);
    return rows[0] || null;
  },
  
  create: async (supplierData) => {
    const { name, contact_person, email, phone, address, notes } = supplierData;
    
    const [result] = await db.query(
      "INSERT INTO suppliers (name, contact_person, email, phone, address, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [name, contact_person || null, email || null, phone, address || null, notes || null]
    );
    
    return result.insertId;
  },
  
  update: async (id, supplierData) => {
  const { name, contact_person, email, phone, address, notes, is_active } = supplierData;
  
  // Use notes field too
  const [result] = await db.query(
    "UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, notes = ?, is_active = ? WHERE id = ?",
    [name, contact_person || null, email || null, phone, address || null, notes || null, is_active === undefined ? true : is_active, id]
  );
  
  // Just return true always since we checked for existence before calling this
  return true;
},
  
  delete: async (id) => {
    // Soft delete by setting is_active to FALSE
    const [result] = await db.query(
      "UPDATE suppliers SET is_active = FALSE WHERE id = ?",
      [id]
    );
    
    return result.affectedRows > 0;
  }
};

export default createSupplierTable;