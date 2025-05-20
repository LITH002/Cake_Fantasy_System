import db from '../config/db.js';

// Order table creation
const createOrderTables = async () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      address TEXT NOT NULL COMMENT 'Full delivery address from geolocation',
      status VARCHAR(50) DEFAULT 'Item Processing',
      payment BOOLEAN DEFAULT FALSE,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      contact_number1 VARCHAR(20) NOT NULL,
      contact_number2 VARCHAR(20),
      special_instructions TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      item_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id),
      UNIQUE KEY (order_id, item_id)
    ) ENGINE=InnoDB`
  ];
  
  // Execute the table creation queries
  try {
    for (const table of tables) {
      await db.query(table);
    }
    console.log("Order tables initialized");
  } catch (error) {
    console.error("Error creating order tables:", error);
    throw error;
  }
};

// Order operations
const Order = {
  // Get or create cart order for user
  getCartOrder: async (userId) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      let [orders] = await connection.query(
        "SELECT id FROM orders WHERE user_id = ? AND status = 'cart' LIMIT 1",
        [userId]
      );
      
      if (!orders.length) {
        const [result] = await connection.query(
          `INSERT INTO orders (
            user_id, 
            amount, 
            address,
            status,
            first_name,
            last_name,
            contact_number1
          ) VALUES (?, 0, '', 'cart', '', '', '')`,
          [userId]
        );
        orders = [{ id: result.insertId }];
      }
      
      await connection.commit();
      return orders[0].id;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }  },
  // Add item to cart/order
  addItem: async (userId, itemId, quantity = 1) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const orderId = await Order.getCartOrder(userId);
      
      // Get the current price from the items table
      const [itemResult] = await connection.query(
        "SELECT selling_price FROM items WHERE id = ?",
        [itemId]
      );
      
      if (!itemResult.length) {
        throw new Error("Item not found");
      }
      
      const price = itemResult[0].selling_price;
      
      await connection.query(`
        INSERT INTO order_items (
          order_id, 
          item_id, 
          quantity, 
          price
        ) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        quantity = quantity + VALUES(quantity)
      `, [orderId, itemId, quantity, price]);
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Remove item from cart
  removeItem: async (userId, itemId) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const [order] = await connection.query(
        "SELECT id FROM orders WHERE user_id = ? AND status = 'cart' LIMIT 1",
        [userId]
      );
      
      if (!order.length) {
        return false;
      }
      
      await connection.query(
        "DELETE FROM order_items WHERE order_id = ? AND item_id = ?",
        [order[0].id, itemId]
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

  // Get cart items for user
  getCart: async (userId) => {
    try {
      const [order] = await db.query(
        "SELECT id FROM orders WHERE user_id = ? AND status = 'cart' LIMIT 1",
        [userId]
      );
      
      if (!order.length) {
        return [];
      }
      
      const [items] = await db.query(`
        SELECT 
          i.id,
          i.name,
          i.image,
          i.selling_price as price,
          oi.quantity,
          (i.selling_price * oi.quantity) as total_price
        FROM order_items oi
        JOIN items i ON oi.item_id = i.id
        WHERE oi.order_id = ?
      `, [order[0].id]);
      
      return items;
    } catch (error) {
      throw error;
    }
  },

  // Clear cart
  clearCart: async (userId) => {
    try {
      const [order] = await db.query(
        "SELECT id FROM orders WHERE user_id = ? AND status = 'cart' LIMIT 1",
        [userId]
      );
      
      if (!order.length) {
        return false;
      }
      
      await db.query(
        "DELETE FROM order_items WHERE order_id = ?",
        [order[0].id]
      );
      
      return true;
    } catch (error) {
      throw error;
    }
  },  // Create a new order
  create: async (userId, items, amount, address, firstName, lastName, contactNumber1, contactNumber2, specialInstructions) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Ensure amount is a valid number
      const validAmount = parseFloat(amount);
      if (isNaN(validAmount) || validAmount <= 0) {
        // Calculate the total from items if amount is invalid
        let calculatedAmount = 0;
        for (const item of items) {
          if (item.price && item.quantity) {
            calculatedAmount += parseFloat(item.price) * parseFloat(item.quantity);
          }
        }
        
        // Add delivery fee (150 LKR)
        calculatedAmount += 150;
        
        if (calculatedAmount <= 0) {
          throw new Error("Invalid order amount and couldn't calculate from items");
        }
        
        console.log(`Calculated order amount: ${calculatedAmount} (original was invalid: ${amount})`);
        amount = calculatedAmount;
      } else {
        amount = validAmount;
      }
      
      console.log(`Creating order for user ${userId} with ${items.length} items, total: ${amount}`);
      
      // Create order
      const [orderResult] = await connection.query(
        `INSERT INTO orders (
          user_id, amount, address, status, payment, first_name, last_name, contact_number1, contact_number2, special_instructions
        ) VALUES (?, ?, ?, 'Item Processing', false, ?, ?, ?, ?, ?)`,
        [
          userId,
          amount,
          address,
          firstName,
          lastName,
          contactNumber1,
          contactNumber2 || null,
          specialInstructions || null
        ]
      );
      
      const orderId = orderResult.insertId;
      console.log(`Created order #${orderId}, now adding items`);
        // Add order items - catching errors for individual items
      for (const item of items) {
        try {
          // Ensure item has a valid price
          let itemPrice = parseFloat(item.price);
          if (isNaN(itemPrice) || itemPrice <= 0) {
            // Fetch the price from the database if it's not valid in the request
            const [priceResult] = await connection.query(
              "SELECT selling_price FROM items WHERE id = ?",
              [item.id]
            );
            
            if (priceResult.length > 0) {
              itemPrice = parseFloat(priceResult[0].selling_price);
              console.log(`Retrieved price ${itemPrice} for item #${item.id} from database`);
            } else {
              console.error(`No price found for item #${item.id}`);
              continue; // Skip this item
            }
          }
          
          console.log(`Adding item #${item.id} x${item.quantity} at price ${itemPrice} to order #${orderId}`);
          await connection.query(
            `INSERT INTO order_items (order_id, item_id, quantity, price) 
             VALUES (?, ?, ?, ?)`,
            [
              orderId,
              item.id,
              item.quantity,
              itemPrice
            ]
          );
        } catch (itemError) {
          console.error(`Failed to add item #${item.id} to order:`, itemError);
          // Continue with other items instead of failing the entire order
        }
      }
      
      console.log(`Order #${orderId} created successfully, committing transaction`);
      await connection.commit();
      return orderId;
    } catch (error) {
      console.error("Error creating order:", error);
      try {
        await connection.rollback();
        console.log("Transaction rolled back due to error");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
      throw error;
    } finally {
      connection.release();
      console.log("Database connection released");
    }
  },

  // Checkout a cart
  checkout: async (userId, orderDetails) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Get cart details
      const [cartOrder] = await connection.query(
        "SELECT id FROM orders WHERE user_id = ? AND status = 'cart' LIMIT 1",
        [userId]
      );
      
      if (!cartOrder.length) {
        throw new Error("No cart found to checkout");
      }
      
      const cartOrderId = cartOrder[0].id;
      
      // Update order details
      await connection.query(
        `UPDATE orders SET
          amount = ?,
          address = ?,
          status = 'Item Processing',
          first_name = ?,
          last_name = ?,
          contact_number1 = ?,
          contact_number2 = ?,
          special_instructions = ?
        WHERE id = ?`,
        [
          orderDetails.amount,
          orderDetails.address,
          orderDetails.firstName,
          orderDetails.lastName,
          orderDetails.contactNumber1,
          orderDetails.contactNumber2,
          orderDetails.specialInstructions,
          cartOrderId
        ]
      );
      
      // Create new empty cart
      await connection.query(
        `INSERT INTO orders (
          user_id, 
          amount, 
          address,
          status,
          first_name,
          last_name,
          contact_number1
        ) VALUES (?, 0, '', 'cart', '', '', '')`,
        [userId]
      );
      
      await connection.commit();
      return cartOrderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Update payment status
  updatePaymentStatus: async (orderId, status) => {
    try {
      await db.query(
        "UPDATE orders SET payment = ? WHERE id = ?",
        [status, orderId]
      );
      
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Find order by ID
  findById: async (orderId) => {
    try {
      console.log(`Finding order by ID: ${orderId}`);
      
      // First get the basic order info
      const [orders] = await db.query(`
        SELECT * FROM orders WHERE id = ? LIMIT 1
      `, [orderId]);
      
      if (!orders.length) {
        console.log(`Order ${orderId} not found`);
        return null;
      }
      
      const order = orders[0];
      console.log(`Found basic info for order ${orderId}`);
      
      // Then get the order items separately
      const [items] = await db.query(`
        SELECT 
          oi.id, 
          oi.item_id, 
          i.name, 
          oi.price, 
          oi.quantity
        FROM order_items oi
        LEFT JOIN items i ON oi.item_id = i.id
        WHERE oi.order_id = ?
      `, [orderId]);
      
      console.log(`Found ${items.length} items for order ${orderId}`);
      
      // Add items to the order object
      order.items = items;
      
      return order;
    } catch (error) {
      console.error(`Error in findById for order ${orderId}:`, error);
      throw error;
    }
  },

  // Find orders by user ID
  findByUserId: async (userId) => {
    try {
      const [orders] = await db.query(`
        SELECT 
          o.id,
          o.amount,
          CASE 
            WHEN o.status = 'processing' THEN 'Item Processing'
            ELSE o.status 
          END AS status,
          o.payment,
          o.created_at,
          o.updated_at,
          (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
        FROM orders o 
        WHERE o.user_id = ? AND o.status != 'cart'
        ORDER BY o.created_at DESC
      `, [userId]);
      
      return orders;
    } catch (error) {
      throw error;
    }
  },

  // List all orders for admin
    // List all orders for admin
  listAll: async ({ status, payment, sort = 'created_at', order = 'desc', page = 1, limit = 20 }) => {
    try {
      // Build the WHERE clause based on filters
      const whereConditions = [];
      const params = [];
      
      if (status) {
        whereConditions.push('o.status = ?');
        params.push(status);
      }
      
      // Only add cart filter if status isn't explicitly provided
      if (!status) {
        whereConditions.push("o.status != 'cart'");
      }
      
      if (payment !== undefined) {
        whereConditions.push('o.payment = ?');
        params.push(payment);
      }
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';
      
      // Build the ORDER BY clause
      const orderClause = `ORDER BY o.${sort} ${order.toUpperCase()}`;
      
      // Add pagination
      const offset = (page - 1) * limit;
      const paginationClause = `LIMIT ${limit} OFFSET ${offset}`;
      
      // Execute the query - REMOVED username from select and the JOIN with users
      const [orders] = await db.query(
        `SELECT 
          o.id,
          o.user_id,
          o.amount,
          o.status,
          o.payment,
          o.first_name,
          o.last_name,
          o.contact_number1,
          o.created_at,
          o.updated_at,
          COUNT(oi.id) as item_count,
          SUM(oi.quantity) as total_items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        ${whereClause}
        GROUP BY o.id
        ${orderClause}
        ${paginationClause}`,
        params
      );
      
      return orders;
    } catch (error) {
      console.error("Error in Order.listAll:", error);
      throw error;
    }
  },

    // Count all orders for pagination
  countAll: async ({ status, payment }) => {
    try {
      // Build the WHERE clause based on filters
      const whereConditions = [];
      const params = [];
      
      if (status) {
        whereConditions.push('o.status = ?');
        params.push(status);
      }
      
      // Only add cart filter if status isn't explicitly provided
      if (!status) {
        whereConditions.push("o.status != 'cart'");
      }
      
      if (payment !== undefined) {
        whereConditions.push('o.payment = ?');
        params.push(payment);
      }
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';
      
      // Execute the query
      const [result] = await db.query(
        `SELECT COUNT(DISTINCT o.id) as total
         FROM orders o
         ${whereClause}`,
        params
      );
      
      return result[0].total;
    } catch (error) {
      console.error("Error in Order.countAll:", error);
      throw error;
    }
  },

  // Update order status
  updateStatus: async (orderId, status) => {
    try {
      // Validate status
      const validStatuses = ['Item Processing', 'Out for Delivery', 'Delivered', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }
      
      const [result] = await db.query(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, orderId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('Order not found');
      }
      
      return true;
    } catch (error) {
      console.error("Error in Order.updateStatus:", error);
      throw error;
    }
  },

  // Get order statistics for admin dashboard
  getStats: async () => {
    try {
      // Get total orders count
      const [totalOrders] = await db.query(
        `SELECT COUNT(*) as count FROM orders WHERE status != 'cart'`
      );

      // Get pending orders count
      const [pendingOrders] = await db.query(
        `SELECT COUNT(*) as count FROM orders WHERE status = 'Item Processing'`
      );

      // Get orders by status count
      const [ordersByStatus] = await db.query(`
        SELECT status, COUNT(*) as count 
        FROM orders 
        WHERE status != 'cart' 
        GROUP BY status
      `);

      // Get daily orders for the last 7 days
      const [dailyOrders] = await db.query(`
        SELECT 
          DATE(created_at) as date, 
          COUNT(*) as count,
          SUM(amount) as revenue
        FROM orders 
        WHERE 
          status != 'cart' AND
          created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      // Get payment statistics
      const [paymentStats] = await db.query(`
        SELECT 
          payment,
          COUNT(*) as count,
          SUM(amount) as total
        FROM orders
        WHERE status != 'cart'
        GROUP BY payment
      `);

      return {
        totalOrders: totalOrders[0].count,
        pendingOrders: pendingOrders[0].count,
        ordersByStatus,
        dailyOrders,
        paymentStats
      };
    } catch (error) {
      console.error("Error getting order stats:", error);
      throw error;
    }
  }
};

export { createOrderTables, Order };