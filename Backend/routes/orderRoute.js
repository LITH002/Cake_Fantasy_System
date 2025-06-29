import express from 'express';
import { Order } from '../models/orderModel.js';
import authMiddleware from '../middleware/auth.js';
import { listOrders, placeOrder, userOrders, verifyOrder } from '../controllers/orderController.js';
import adminMiddleware from '../middleware/admin.js';

const router = express.Router();

// Place order (checkout)
router.post("/place", authMiddleware, placeOrder);

// Verify payment (for payment gateways)
router.post("/verify", verifyOrder);

// Get order history (simple list)
router.get("/history", authMiddleware, userOrders);

// Get user orders with full details
router.get("/user/orders", authMiddleware, userOrders);

// Admin routes
router.get("/admin/list", authMiddleware, adminMiddleware(), listOrders);

// Get order details for admin
router.get("/admin/:orderId", authMiddleware, adminMiddleware(), async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        
        if (!order) {
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
        console.error("Admin order details error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to get order details"
        });
    }
});

// Get order details for user
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

// Update order status
router.post("/update-status", authMiddleware, adminMiddleware(), async (req, res) => {
  try {
    const { orderId, status } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Order ID and status are required"
      });
    }

    await Order.updateStatus(orderId, status);
    
    res.json({
      success: true,
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status"
    });
  }
});

// Update payment status
router.post("/update-payment", authMiddleware, adminMiddleware(), async (req, res) => {
  try {
    const { orderId, payment } = req.body;
    
    if (!orderId || payment === undefined) {
      return res.status(400).json({
        success: false,
        message: "Order ID and payment status are required"
      });
    }

    await Order.updatePaymentStatus(orderId, payment);
    
    res.json({
      success: true,
      message: `Payment status updated to ${payment ? 'Paid' : 'Unpaid'}`
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status"
    });
  }
});

export default router;