import db from "../config/db.js";

// Temporary cart management using order_items with status='cart'
const addToCart = async (req, res) => {
    try {
        const { item_id, quantity } = req.body;
        const userId = req.user.id; // From auth middleware

        // Validate input
        if (!item_id || !quantity) {
            return res.status(400).json({
                success: false,
                message: "Missing item_id or quantity"
            });
        }

        // Check if item exists and get its details for validation
        const [items] = await db.query(
            `SELECT 
                id, 
                name, 
                selling_price, 
                stock_quantity, 
                unit, 
                is_loose, 
                min_order_quantity, 
                increment_step, 
                weight_value, 
                weight_unit
            FROM items 
            WHERE id = ?`,
            [item_id]
        );
        
        if (!items.length) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }

        const item = items[0];
        const parsedQuantity = parseFloat(quantity);

        // Validate quantity is a positive number
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive number"
            });
        }

        // Validate quantity for loose items
        if (item.is_loose) {
            // Check if quantity meets minimum order requirement
            if (parsedQuantity < item.min_order_quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum order quantity is ${item.min_order_quantity} ${item.unit} for this item`
                });
            }
            
            // Check if quantity is in valid increments
            if (item.increment_step > 0) {
                const remainder = (parsedQuantity - item.min_order_quantity) % item.increment_step;
                if (remainder !== 0 && parsedQuantity !== item.min_order_quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Quantity must be in increments of ${item.increment_step} ${item.unit} starting from ${item.min_order_quantity} ${item.unit}`
                    });
                }
            }
        } else {
            // For non-loose items, quantity must be a whole number
            if (!Number.isInteger(parsedQuantity)) {
                return res.status(400).json({
                    success: false,
                    message: "Quantity must be a whole number for this item"
                });
            }
        }

        // Check if enough stock is available
        if (parsedQuantity > item.stock_quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${item.stock_quantity} ${item.unit} available in stock`
            });
        }

        // Check for existing cart item
        const [existing] = await db.query(`
            SELECT oi.id, oi.quantity 
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = ? 
            AND oi.item_id = ? 
            AND o.status = 'cart'
        `, [userId, item_id]);

        if (existing.length > 0) {
            // Check if total quantity would exceed stock
            const newTotalQuantity = parseFloat(existing[0].quantity) + parsedQuantity;
            
            if (newTotalQuantity > item.stock_quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot add ${parsedQuantity} ${item.unit} more. You already have ${existing[0].quantity} ${item.unit} in your cart and only ${item.stock_quantity} ${item.unit} is available.`
                });
            }
            
            // Update quantity
            await db.query(`
                UPDATE order_items 
                SET quantity = quantity + ? 
                WHERE id = ?
            `, [parsedQuantity, existing[0].id]);
        } else {
            // Get or create cart order
            let [order] = await db.query(`
                SELECT id FROM orders 
                WHERE user_id = ? AND status = 'cart'
                LIMIT 1
            `, [userId]);

            if (!order.length) {
                // Create new cart order
                [order] = await db.query(`
                    INSERT INTO orders (
                        user_id, 
                        amount, 
                        address,
                        status,
                        first_name,
                        last_name,
                        contact_number1
                    ) VALUES (?, 0, '', 'cart', '', '', '')
                `, [userId]);
                order = { id: order.insertId };
            }

            // Add new item to cart
            await db.query(`
                INSERT INTO order_items (
                    order_id, 
                    item_id, 
                    quantity, 
                    price
                ) VALUES (?, ?, ?, ?)
            `, [order.id, item_id, parsedQuantity, item.selling_price]);
        }

        res.json({ 
            success: true, 
            message: `Added ${parsedQuantity} ${item.unit} of ${item.name} to cart`,
            data: {
                item_id: item.id,
                name: item.name,
                quantity: parsedQuantity,
                unit: item.unit
            }
        });
    } catch (error) {
        console.error("Cart add error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update item quantity in cart
const updateCartItem = async (req, res) => {
    try {
        const { item_id, quantity } = req.body;
        const userId = req.user.id;
        
        if (!item_id || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Item ID and quantity are required"
            });
        }
        
        const parsedQuantity = parseFloat(quantity);
        
        // If quantity is 0, remove the item
        if (parsedQuantity === 0) {
            return removeFromCart(req, res);
        }
        
        // Validate quantity is positive
        if (isNaN(parsedQuantity) || parsedQuantity < 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive number"
            });
        }
        
        // Get item details for validation
        const [items] = await db.query(
            `SELECT 
                id, 
                name, 
                stock_quantity, 
                unit, 
                is_loose, 
                min_order_quantity, 
                increment_step
            FROM items 
            WHERE id = ?`,
            [item_id]
        );
        
        if (!items.length) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }
        
        const item = items[0];
        
        // Validate quantity for loose items
        if (item.is_loose) {
            // Check if quantity meets minimum order requirement
            if (parsedQuantity < item.min_order_quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum order quantity is ${item.min_order_quantity} ${item.unit} for this item`
                });
            }
            
            // Check if quantity is in valid increments
            if (item.increment_step > 0) {
                const remainder = (parsedQuantity - item.min_order_quantity) % item.increment_step;
                if (remainder !== 0 && parsedQuantity !== item.min_order_quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Quantity must be in increments of ${item.increment_step} ${item.unit} starting from ${item.min_order_quantity} ${item.unit}`
                    });
                }
            }
        } else {
            // For non-loose items, quantity must be a whole number
            if (!Number.isInteger(parsedQuantity)) {
                return res.status(400).json({
                    success: false,
                    message: "Quantity must be a whole number for this item"
                });
            }
        }
        
        // Check if enough stock is available
        if (parsedQuantity > item.stock_quantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${item.stock_quantity} ${item.unit} available in stock`
            });
        }
        
        // Find the cart and item
        const [cartItems] = await db.query(`
            SELECT oi.id
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = ? 
            AND oi.item_id = ? 
            AND o.status = 'cart'
        `, [userId, item_id]);
        
        if (!cartItems.length) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }
        
        // Update the quantity
        await db.query(`
            UPDATE order_items 
            SET quantity = ? 
            WHERE id = ?
        `, [parsedQuantity, cartItems[0].id]);
        
        res.json({
            success: true,
            message: `Updated quantity to ${parsedQuantity} ${item.unit}`,
            data: {
                item_id: item.id,
                name: item.name,
                quantity: parsedQuantity,
                unit: item.unit
            }
        });
    } catch (error) {
        console.error("Cart update error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { item_id } = req.body;
        const userId = req.user.id;
        
        if (!item_id) {
            return res.status(400).json({
                success: false,
                message: "Item ID is required"
            });
        }

        // Find user's cart
        const [cart] = await db.query(`
            SELECT o.id 
            FROM orders o
            WHERE o.user_id = ? 
            AND o.status = 'cart'
            LIMIT 1
        `, [userId]);
        
        if (cart.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }
        
        const orderId = cart[0].id;

        // Get item name and unit for better response message
        const [itemDetails] = await db.query(`
            SELECT i.name, i.unit
            FROM items i
            JOIN order_items oi ON i.id = oi.item_id
            WHERE oi.order_id = ? AND oi.item_id = ?
        `, [orderId, item_id]);

        // Remove item from cart
        const [result] = await db.query(`
            DELETE FROM order_items
            WHERE order_id = ?
            AND item_id = ?
        `, [orderId, item_id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        res.json({ 
            success: true, 
            message: itemDetails.length > 0 
                ? `Removed ${itemDetails[0].name} from cart` 
                : "Removed item from cart" 
        });
    } catch (error) {
        console.error("Cart remove error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get cart items with details including unit information
        const [items] = await db.query(`
            SELECT 
                oi.item_id AS id,
                i.name,
                i.image,
                i.selling_price AS price,
                i.unit,
                i.is_loose,
                i.min_order_quantity,
                i.increment_step,
                i.weight_value,
                i.weight_unit,
                oi.quantity,
                (i.selling_price * oi.quantity) AS total_price
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN items i ON oi.item_id = i.id
            WHERE o.user_id = ?
            AND o.status = 'cart'
        `, [userId]);

        // Calculate cart total
        const [total] = await db.query(`
            SELECT SUM(i.selling_price * oi.quantity) AS total
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN items i ON oi.item_id = i.id
            WHERE o.user_id = ?
            AND o.status = 'cart'
        `, [userId]);

        // Format the quantities based on item type
        const formattedItems = items.map(item => ({
            ...item,
            formatted_quantity: `${item.quantity} ${item.unit}`,
            // Add increment steps for the UI
            quantity_options: item.is_loose ? 
                generateQuantityOptions(
                    item.min_order_quantity, 
                    item.increment_step, 
                    Math.min(item.stock_quantity, 1000), // Cap at 1000 for UI performance
                    item.unit
                ) : 
                generateWholeNumberOptions(1, Math.min(item.stock_quantity, 100), item.unit) // Cap at 100 for UI
        }));

        res.json({
            success: true,
            data: {
                items: formattedItems,
                total: total[0].total || 0,
                item_count: items.length
            }
        });
    } catch (error) {
        console.error("Cart fetch error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch cart"
        });
    }
};

// Helper function to generate quantity options for loose items
const generateQuantityOptions = (minQty, step, maxQty, unit) => {
    const options = [];
    let currentQty = minQty;
    
    while (currentQty <= maxQty) {
        options.push({
            value: currentQty,
            label: `${currentQty} ${unit}`
        });
        currentQty += step;
    }
    
    return options;
};

// Helper function to generate quantity options for whole number items
const generateWholeNumberOptions = (min, max, unit) => {
    return Array.from({ length: max - min + 1 }, (_, i) => ({
        value: min + i,
        label: `${min + i} ${unit}`
    }));
};

// Empty cart completely
const emptyCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find user's cart
        const [cart] = await db.query(`
            SELECT id 
            FROM orders 
            WHERE user_id = ? 
            AND status = 'cart'
            LIMIT 1
        `, [userId]);
        
        if (cart.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }
        
        // Remove all items from cart
        await db.query(`
            DELETE FROM order_items
            WHERE order_id = ?
        `, [cart[0].id]);
        
        res.json({
            success: true,
            message: "Cart emptied successfully"
        });
    } catch (error) {
        console.error("Empty cart error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to empty cart"
        });
    }
};

export { addToCart, updateCartItem, removeFromCart, getCart, emptyCart };