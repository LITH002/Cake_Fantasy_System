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

        // Check if item exists
        const [item] = await db.query(
            "SELECT id FROM items WHERE id = ?",
            [item_id]
        );
        
        if (!item.length) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
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
            // Update quantity
            await db.query(`
                UPDATE order_items 
                SET quantity = quantity + ? 
                WHERE id = ?
            `, [quantity, existing[0].id]);
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
                ) SELECT 
                    ?, 
                    ?, 
                    ?, 
                    price 
                FROM items 
                WHERE id = ?
            `, [order.id, item_id, quantity, item_id]);
        }

        res.json({ success: true, message: "Added to cart" });
    } catch (error) {
        console.error("Cart add error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Add debugging to removeFromCart
const removeFromCart = async (req, res) => {
    try {
        const { item_id } = req.body;
        const userId = req.user.id;
        
        console.log(`Request to remove item #${item_id} from cart for user #${userId}`);
        
        if (!item_id) {
            console.log("Missing item_id in request");
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
            console.log(`No cart found for user #${userId}`);
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }
        
        const orderId = cart[0].id;
        console.log(`Found cart #${orderId} for user #${userId}`);

        // Remove item from cart
        const [result] = await db.query(`
            DELETE FROM order_items
            WHERE order_id = ?
            AND item_id = ?
        `, [orderId, item_id]);
        
        console.log(`Removed item #${item_id} from cart #${orderId}, affected rows: ${result.affectedRows}`);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        res.json({ success: true, message: "Removed from cart" });
    } catch (error) {
        console.error("Cart remove error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get cart items with details
        const [items] = await db.query(`
            SELECT 
                oi.item_id AS id,
                i.name,
                i.image,
                i.price,
                oi.quantity,
                (i.price * oi.quantity) AS total_price
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN items i ON oi.item_id = i.id
            WHERE o.user_id = ?
            AND o.status = 'cart'
        `, [userId]);

        // Calculate cart total
        const [total] = await db.query(`
            SELECT SUM(i.price * oi.quantity) AS total
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN items i ON oi.item_id = i.id
            WHERE o.user_id = ?
            AND o.status = 'cart'
        `, [userId]);

        res.json({
            success: true,
            data: {
                items,
                total: total[0].total || 0
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

export { addToCart, removeFromCart, getCart };