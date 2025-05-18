import express from 'express';
import { Order } from '../models/orderModel.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Add item to cart
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const { item_id, quantity = 1 } = req.body;
        await Order.addItem(req.user.id, item_id, quantity);
        res.json({ 
            success: true, 
            message: "Item added to cart",
            data: { item_id, quantity }
        });
    } catch (error) {
        console.error("Add to cart error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to add to cart"
        });
    }
});

// Remove item from cart
router.post("/remove", authMiddleware, async (req, res) => {
    try {
        const { item_id } = req.body;
        await Order.removeItem(req.user.id, item_id);
        res.json({ 
            success: true, 
            message: "Item removed from cart",
            data: { item_id }
        });
    } catch (error) {
        console.error("Remove from cart error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Failed to remove from cart"
        });
    }
});

// Get cart contents
router.get("/", authMiddleware, async (req, res) => {
    try {
        const cartItems = await Order.getCart(req.user.id);
        const total = cartItems.reduce((sum, item) => sum + item.total_price, 0);
        
        res.json({ 
            success: true, 
            data: {
                items: cartItems,
                total: (Number(total) || 0).toFixed(2)
            }
        });
    } catch (error) {
        console.error("Get cart error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to get cart contents"
        });
    }
});

export default router;