import express from 'express';
import { Order } from '../models/orderModel.js';
import authMiddleware from '../middleware/auth.js';
import { placeOrder, userOrders, verifyOrder } from '../controllers/orderController.js';

const router = express.Router();

// Place order (checkout) - Add console logs for debugging
router.post("/place", authMiddleware, (req, res, next) => {
  console.log("Order route accessed with user:", req.user?.id);
  console.log("Request body:", {
    userId: req.body.userId,
    itemsCount: req.body.items?.length,
    amount: req.body.amount
  });
  next();
}, placeOrder);

// Verify payment (for payment gateways)
router.post("/verify", verifyOrder);

// Get order history (simple list)
router.get("/history", authMiddleware, async (req, res) => {
    try {
        const orders = await Order.findByUserId(req.user.id);
        res.json({ 
            success: true, 
            data: orders
        });
    } catch (error) {
        console.error("Order history error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to get order history"
        });
    }
});

// Get user orders with full details
router.get("/user/orders", authMiddleware, userOrders);

// Get order details
router.get("/:orderId", authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        
        if (!order || order.user_id !== req.user.id) {
            return res.status(404).json({ 
                success: false, 
                message: "Order not found" 
            });
        }
        
        res.json({ 
            success: true, 
            data: order
        });
    } catch (error) {
        console.error("Order details error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to get order details"
        });
    }
});

export default router;