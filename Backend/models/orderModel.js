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

  try {
    for (const sql of tables) {
      await db.query(sql);
    }
    console.log("Order tables created successfully");
  } catch (err) {
    console.error("Error creating order tables:", err);
    throw err;
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
    }
  },

  // Add item to cart/order
  addItem: async (userId, itemId, quantity = 1) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const orderId = await Order.getCartOrder(userId);
      
      await connection.query(`
        INSERT INTO order_items (
          order_id, 
          item_id, 
          quantity, 
          price
        ) SELECT 
          ?, 
          ?, 
          ?, 
          price 
        FROM items 
        WHERE id = ?
        ON DUPLICATE KEY UPDATE 
        quantity = quantity + VALUES(quantity)
      `, [orderId, itemId, quantity, itemId]);
      
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
          i.price,
          oi.quantity,
          (i.price * oi.quantity) as total_price
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
  },

  // Create a new order
create: async (userId, items, amount, address, firstName, lastName, contactNumber1, contactNumber2, specialInstructions) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
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
        console.log(`Adding item #${item.id} x${item.quantity} to order #${orderId}`);
        await connection.query(
          `INSERT INTO order_items (order_id, item_id, quantity, price) 
           VALUES (?, ?, ?, ?)`,
          [
            orderId,
            item.id,
            item.quantity,
            item.price
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

  //Find orders by user ID
  findByUserId: async (userId) => {
    try {
      const [orders] = await db.query(`
        SELECT 
          o.id,
          o.amount,
          o.status,
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
  }
};

export { createOrderTables, Order };