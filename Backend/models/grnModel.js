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
      selling_price DECIMAL(10,2) NULL,
      expiry_date DATE NULL,
      batch_number VARCHAR(100) NULL,
      notes TEXT,
      item_barcode VARCHAR(50) NULL,
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
  
  // Get the maximum suffix used today to ensure uniqueness
  const [results] = await db.query(
    "SELECT MAX(SUBSTRING_INDEX(grn_number, '-', -1)) as max_count FROM grn_headers WHERE grn_number LIKE ?",
    [`GRN-${dateStr}-%`]
  );
  
  let todayCount = 1;
  if (results[0].max_count) {
    // If we found existing GRNs today, increment by 1
    todayCount = parseInt(results[0].max_count) + 1;
  }
  
  // Format with leading zeros
  const grnNumber = `GRN-${dateStr}-${todayCount.toString().padStart(3, '0')}`;
  
  // Double-check the generated number doesn't exist (safety check)
  const [existingCheck] = await db.query(
    "SELECT COUNT(*) as count FROM grn_headers WHERE grn_number = ?",
    [grnNumber]
  );
  
  if (existingCheck[0].count > 0) {
    // If somehow it still exists, add a random suffix
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `GRN-${dateStr}-${todayCount.toString().padStart(3, '0')}-${randomSuffix}`;
  }
  
  return grnNumber;
},
  
  // Create GRN
  create: async (grnData, items, retryCount = 0) => {
  const connection = await db.getConnection();
  let grnId; // Define grnId at the method scope so it's available throughout
  let grnNumber;
  
  try {
    await connection.beginTransaction();
    
    // Generate GRN number with retry logic to avoid duplicates
    grnNumber = await GRN.generateGRNNumber();
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (parseFloat(item.unit_price) * parseFloat(item.received_quantity));
    }, 0);
    
    try {
      // Insert GRN header
      const [headerResult] = await connection.query(
        `INSERT INTO grn_headers (
          grn_number, supplier_id, po_reference, 
          received_date, received_by, notes, total_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          grnNumber,
          grnData.supplier_id,
          grnData.po_reference || null,
          grnData.received_date,
          grnData.received_by,
          grnData.notes || null,
          totalAmount
        ]
      );
      
      // Assign to the outer scope variable
      grnId = headerResult.insertId;
      
      // Rest of your existing code for inserting details
      // ...
      
    } catch (insertError) {
      // Check if it's a duplicate key error
      if (insertError.code === 'ER_DUP_ENTRY' && retryCount < 3) {
        // Release connection and retry
        await connection.rollback();
        connection.release();
        console.log(`Duplicate GRN number encountered, retrying (attempt ${retryCount + 1})...`);
        
        // Wait a short time to avoid collisions
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry with incremented counter
        return await GRN.create(grnData, items, retryCount + 1);
      } else {
        // Re-throw the error for other error types
        throw insertError;
      }
    }
    
    await connection.commit();
    
    // Now grnId is accessible here
    return {
      id: grnId,
      grn_number: grnNumber
    };
  } catch (error) {
    await connection.rollback();
    console.error("Error creating GRN:", error);
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
    
    // Send event through WebSocket to update clients
    if (global.io) {
      global.io.emit('inventory-updated', {
        type: 'grn-completed',
        grnId
      });
    }
    
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
  
  // Get GRN details with enhanced unit information
  const [details] = await db.query(
    `SELECT 
      gd.*,
      i.name as item_name,
      i.sku,
      i.barcode,
      i.image,
      i.is_loose,
      i.category,
      COALESCE(gd.unit, i.unit, 'piece') as unit,
      COALESCE(gd.item_barcode, i.barcode, i.sku) as display_barcode
    FROM grn_details gd
    JOIN items i ON gd.item_id = i.id
    WHERE gd.grn_id = ?`,
    [id]
  );
  
  grn.items = details;
  
  return grn;
},
  
  // List all GRNs with pagination and filters
  findAll: async ({ supplier_id, startDate, endDate, page = 1, limit = 20 }) => {
    let whereConditions = [];
    const params = [];
    
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

  // updateStatus: async (id, status, userId) => {
  //   const connection = await db.getConnection();
    
  //   try {
  //     await connection.beginTransaction();
      
  //     console.log(`Attempting to update GRN #${id} status to "${status}" by user ${userId}`);
      
  //     // Check if the record exists first
  //     const [checkResult] = await connection.query(
  //       'SELECT id, status FROM grn_headers WHERE id = ?',
  //       [id]
  //     );
      
  //     if (checkResult.length === 0) {
  //       console.log(`GRN #${id} not found`);
  //       await connection.rollback();
  //       return false;
  //     }
      
  //     console.log(`Current GRN status: ${checkResult[0].status}`);

  //     const validStatuses = ['pending', 'approved', 'rejected'];
  //     if (!validStatuses.includes(status)) {
  //       console.error(`Invalid status value: "${status}". Must be one of: ${validStatuses.join(', ')}`);
  //       await connection.rollback();
  //       return false;
  //     }
      
  //     // Fix the SQL syntax error (extra comma)
  //     const [updateResult] = await connection.query(
  //       `UPDATE grn_headers SET 
  //         status = ?, 
  //         updated_at = NOW()
  //       WHERE id = ?`,
  //       [status, id]
  //     );
      
  //     console.log(`Database update result:`, updateResult);
      
  //     if (updateResult.affectedRows === 0) {
  //       console.log(`GRN #${id} status update failed - no rows affected`);
  //       await connection.rollback();
  //       return false;
  //     }
      
  //     await connection.commit();
  //     console.log(`GRN #${id} status updated successfully to ${status}`);
  //     return true;
  //   } catch (error) {
  //     await connection.rollback();
  //     console.error(`Error updating GRN status:`, error);
  //     throw error;
  //   } finally {
  //     connection.release();
  //   }
  // }
};


export default createGRNTables;