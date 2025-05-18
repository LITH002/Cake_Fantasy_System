import db from "../config/db.js";

export const createGRNTables = async () => {
  const headerTable = `
    CREATE TABLE IF NOT EXISTS grn_headers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grn_number VARCHAR(50) NOT NULL UNIQUE,
      supplier_id INT NOT NULL,
      po_reference VARCHAR(100),
      received_date DATE NOT NULL,
      received_by INT NOT NULL,
      notes TEXT,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (received_by) REFERENCES admin_users(id)
    );`;

  const detailTable = `
    CREATE TABLE IF NOT EXISTS grn_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grn_id INT NOT NULL,
      item_id INT NOT NULL,
      expected_quantity INT NOT NULL,
      received_quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      expiry_date DATE NULL,
      batch_number VARCHAR(100) NULL,
      notes TEXT,
      FOREIGN KEY (grn_id) REFERENCES grn_headers(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id)
    );`;

  await db.query(headerTable);
  await db.query(detailTable);
};

export const GRN = {
  // Generate GRN number
  generateGRNNumber: async () => {
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    
    // Get count of GRNs created today to add as suffix
    const [results] = await db.query(
      "SELECT COUNT(*) as count FROM grn_headers WHERE DATE(created_at) = CURDATE()"
    );
    
    const todayCount = results[0].count + 1;
    return `GRN-${dateStr}-${todayCount.toString().padStart(3, '0')}`;
  },
  
  // Create GRN
  create: async (grnData, items) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Generate GRN number
      const grnNumber = await GRN.generateGRNNumber();
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => 
        sum + (item.received_quantity * item.unit_price), 0);
      
      // Insert GRN header
      const [headerResult] = await connection.query(
        `INSERT INTO grn_headers (
          grn_number, supplier_id, po_reference, received_date,
          received_by, notes, total_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          grnNumber,
          grnData.supplier_id,
          grnData.po_reference || null,
          grnData.received_date,
          grnData.received_by,
          grnData.notes || null,
          totalAmount,
          'pending'
        ]
      );
      
      const grnId = headerResult.insertId;
      
      // Insert GRN details
      for (const item of items) {
        await connection.query(
          `INSERT INTO grn_details (
            grn_id, item_id, expected_quantity, received_quantity,
            unit_price, expiry_date, batch_number, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            grnId,
            item.item_id,
            item.expected_quantity || item.received_quantity,
            item.received_quantity,
            item.unit_price,
            item.expiry_date || null,
            item.batch_number || null,
            item.notes || null
          ]
        );
      }
      
      await connection.commit();
      return { id: grnId, grn_number: grnNumber };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  
  // Complete and process GRN (update inventory)
  complete: async (grnId) => {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get GRN details
      const [grnDetails] = await connection.query(
        `SELECT 
          gd.item_id, 
          gd.received_quantity, 
          gd.unit_price,
          i.stock_quantity as current_stock,
          i.cost_price as current_cost
        FROM grn_details gd
        JOIN items i ON gd.item_id = i.id
        WHERE gd.grn_id = ?`,
        [grnId]
      );
      
      // Update inventory for each item
      for (const detail of grnDetails) {
        // Update stock quantity
        await connection.query(
          "UPDATE items SET stock_quantity = stock_quantity + ?, cost_price = ? WHERE id = ?",
          [detail.received_quantity, detail.unit_price, detail.item_id]
        );
        
        // Log inventory change
        await connection.query(
          `INSERT INTO inventory_logs (
            item_id, adjustment_quantity, previous_quantity,
            new_quantity, adjustment_type, admin_id, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            detail.item_id,
            detail.received_quantity,
            detail.current_stock,
            detail.current_stock + detail.received_quantity,
            'add',
            1, // Default admin ID, replace with actual user
            `GRN #${grnId} completion`
          ]
        );
      }
      
      // Update GRN status to approved
      await connection.query(
        "UPDATE grn_headers SET status = 'approved' WHERE id = ?",
        [grnId]
      );
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  
  // Find GRN by ID with details
  findById: async (id) => {
    // Get GRN header
    const [headers] = await db.query(
      `SELECT 
        gh.*,
        s.name as supplier_name,
        CONCAT(a.first_name, ' ', a.last_name) as received_by_name
      FROM grn_headers gh
      JOIN suppliers s ON gh.supplier_id = s.id
      JOIN admin_users a ON gh.received_by = a.id
      WHERE gh.id = ?`,
      [id]
    );
    
    if (!headers.length) {
      return null;
    }
    
    const grn = headers[0];
    
    // Get GRN details
    const [details] = await db.query(
      `SELECT 
        gd.*,
        i.name as item_name,
        i.sku,
        i.image,
        i.unit
      FROM grn_details gd
      JOIN items i ON gd.item_id = i.id
      WHERE gd.grn_id = ?`,
      [id]
    );
    
    grn.items = details;
    
    return grn;
  },
  
  // List all GRNs with pagination and filters
  findAll: async ({ status, supplier_id, startDate, endDate, page = 1, limit = 20 }) => {
    let whereConditions = [];
    const params = [];
    
    if (status) {
      whereConditions.push("gh.status = ?");
      params.push(status);
    }
    
    if (supplier_id) {
      whereConditions.push("gh.supplier_id = ?");
      params.push(supplier_id);
    }
    
    if (startDate) {
      whereConditions.push("gh.received_date >= ?");
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push("gh.received_date <= ?");
      params.push(endDate);
    }
    
    const whereClause = whereConditions.length 
      ? `WHERE ${whereConditions.join(" AND ")}` 
      : "";
    
    // Get paginated GRN headers
    const offset = (page - 1) * limit;
    
    const [grns] = await db.query(
      `SELECT 
        gh.*,
        s.name as supplier_name,
        CONCAT(a.first_name, ' ', a.last_name) as received_by_name,
        (SELECT COUNT(*) FROM grn_details WHERE grn_id = gh.id) as items_count
      FROM grn_headers gh
      JOIN suppliers s ON gh.supplier_id = s.id
      JOIN admin_users a ON gh.received_by = a.id
      ${whereClause}
      ORDER BY gh.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    // Get total count for pagination
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM grn_headers gh ${whereClause}`,
      params
    );
    
    return {
      data: grns,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    };
  },
  
  // Cancel GRN
  cancel: async (id) => {
    const [result] = await db.query(
      "UPDATE grn_headers SET status = 'rejected' WHERE id = ? AND status = 'pending'",
      [id]
    );
    
    return result.affectedRows > 0;
  },

 updateStatus: async (id, status, userId) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log(`Updating GRN #${id} status to ${status} by user ${userId}`);
    
    // Check if the record exists first
    const [checkResult] = await connection.query(
      'SELECT id, status FROM grn_headers WHERE id = ?',
      [id]
    );
    
    if (checkResult.length === 0) {
      console.log(`GRN #${id} not found`);
      await connection.rollback();
      return false;
    }
    
    console.log(`Current GRN status: ${checkResult[0].status}`);
    
    // Update GRN status in grn_headers table - explicitly handle status column
    const [updateResult] = await connection.query(
      `UPDATE grn_headers SET 
        status = ?, 
        updated_at = NOW(),
        updated_by = ?
      WHERE id = ?`,
      [status, userId, id]
    );
    
    console.log(`Database update result:`, updateResult);
    
    if (updateResult.affectedRows === 0) {
      console.log(`GRN #${id} status update failed - no rows affected`);
      await connection.rollback();
      return false;
    }
    
    // If approved, update inventory
    if (status === 'approved') {
      // Get the GRN items
      const [items] = await connection.query(
        `SELECT item_id, received_quantity FROM grn_details WHERE grn_id = ?`,
        [id]
      );
      
      console.log(`Found ${items.length} items to update in inventory`);
      
      // Update inventory for each item
      for (const item of items) {
        await connection.query(
          `UPDATE items SET 
            stock_quantity = COALESCE(stock_quantity, 0) + ? 
          WHERE id = ?`,
          [item.received_quantity, item.item_id]
        );
        
        console.log(`Added ${item.received_quantity} units to item #${item.item_id}`);
        
        // Add inventory transaction record if you have that table
        try {
          await connection.query(
            `INSERT INTO inventory_transactions 
              (item_id, quantity, transaction_type, reference_id, reference_type, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              item.item_id,
              item.received_quantity,
              'in',
              id,
              'grn',
              `GRN #${id} approval`,
              userId
            ]
          );
        } catch (transactionError) {
          console.warn("Could not record inventory transaction:", transactionError.message);
        }
      }
    }
    
    // Verify the update was successful
    const [verifyResult] = await connection.query(
      'SELECT status FROM grn_headers WHERE id = ?',
      [id]
    );
    
    if (verifyResult.length > 0) {
      console.log(`GRN #${id} new status: ${verifyResult[0].status}`);
    }
    
    await connection.commit();
    console.log(`GRN #${id} status updated successfully to ${status}`);
    return true;
  } catch (error) {
    await connection.rollback();
    console.error(`Error updating GRN status:`, error);
    throw error;
  } finally {
    connection.release();
  }
}
};


export default createGRNTables;