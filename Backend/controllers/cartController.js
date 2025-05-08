import db from "../config/db.js";

// Add items to the user cart
const addToCart = async (req, res) => {
    try {
        const { userId, id } = req.body;
        
        // Check if item already exists in cart
        const [existing] = await db.query(
            "SELECT * FROM user_carts WHERE user_id = ? AND item_id = ?",
            [userId, id]
        );

        if (existing.length > 0) {
            // Increment quantity if exists
            await db.query(
                "UPDATE user_carts SET quantity = quantity + 1 WHERE user_id = ? AND item_id = ?",
                [userId, id]
            );
        } else {
            // Add new item with quantity 1
            await db.query(
                "INSERT INTO user_carts (user_id, item_id, quantity) VALUES (?, ?, 1)",
                [userId, id]
            );
        }

        res.json({ success: true, message: "Added to cart" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error adding to cart" });
    }
}

// Remove items from the user cart (updated to decrement quantity)
const removeFromCart = async (req, res) => {
    try {
        const { userId, itemId } = req.body;
        
        // 1. Get current quantity
        const [rows] = await db.query(
            "SELECT quantity FROM user_carts WHERE user_id = ? AND item_id = ?",
            [userId, itemId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Item not found in cart" });
        }

        const currentQuantity = rows[0].quantity;

        // 2. Decide whether to decrement or remove
        if (currentQuantity > 1) {
            // Decrement quantity
            await db.query(
                "UPDATE user_carts SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ?",
                [userId, itemId]
            );
            return res.json({ success: true, message: "Quantity reduced by 1" });
        } else {
            // Remove item completely
            await db.query(
                "DELETE FROM user_carts WHERE user_id = ? AND item_id = ?",
                [userId, itemId]
            );
            return res.json({ success: true, message: "Item removed from cart" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error modifying cart" });
    }
}

// Fetch user cart data
const getCart = async (req, res) => {
    try {
        const { userId } = req.body;
        
        const [items] = await db.query(
            `SELECT uc.item_id, uc.quantity, i.name, i.price, i.image 
             FROM user_carts uc
             JOIN items i ON uc.item_id = i.id
             WHERE uc.user_id = ?`,
            [userId]
        );

        res.json({ success: true, data: items });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error fetching cart" });
    }
}

export { addToCart, removeFromCart, getCart };