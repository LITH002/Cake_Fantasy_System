import { Order } from "../models/orderModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  const frontend_url = "http://localhost:5173";
  
  try {
    // Destructure all required fields from request body
    const { 
      userId,
      items,
      amount,
      address,
      firstName,
      lastName,
      contactNumber1,
      contactNumber2 = "", 
      specialInstructions = "" 
    } = req.body;    // Validate required fields
    if (!firstName || !lastName || !contactNumber1 || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing required delivery information"
      });
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items in order"
      });
    }
      
    // Validate amount is provided and is a number
    if (amount === undefined || amount === null || isNaN(parseFloat(amount))) {
      // Calculate the amount from items if not provided or invalid
      const calculatedAmount = items.reduce((total, item) => {
        const itemPrice = parseFloat(item.price || 0);
        const quantity = parseFloat(item.quantity || 0);
        return total + (itemPrice * quantity);
      }, 0) + 150; // Add delivery fee
      
      if (calculatedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Order amount is required and must be a valid number"
        });
      }
      
      console.log(`Calculated amount: ${calculatedAmount} (original was invalid: ${amount})`);
      amount = calculatedAmount;
    }

    console.log("Creating order with data:", {
      userId: userId || req.user.id,
      itemsCount: items.length,
      amount,
      address: address.substring(0, 20) + "..." // Log truncated for brevity
    });

    // 1. Create order in database
    const orderId = await Order.create(
      userId || req.user.id, // Use authenticated user id if userId not provided
      items, 
      amount, 
      address, 
      firstName, 
      lastName, 
      contactNumber1, 
      contactNumber2, 
      specialInstructions
    );
    
    console.log(`Order ${orderId} created successfully, now clearing cart`);
    
    // 2. Clear user's cart using Order model
    await Order.clearCart(userId || req.user.id);
      // 3. Create Stripe session
    const line_items = items.map(item => {
      // Ensure price is valid
      const price = parseFloat(item.price);
      if (isNaN(price) || price <= 0) {
        console.error(`Invalid price for item ${item.id}: ${item.price}`);
        return null;
      }
      
      // Ensure quantity is valid
      const quantity = parseInt(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        console.error(`Invalid quantity for item ${item.id}: ${item.quantity}`);
        return null;
      }
      
      return {
        price_data: {
          currency: "lkr",
          product_data: { 
            name: item.name || `Product ID: ${item.id}`,
            metadata: { item_id: item.id } 
          },
          unit_amount: Math.round(price * 100) // Convert to cents (LKR)
        },
        quantity: quantity
      };
    }).filter(item => item !== null); // Remove invalid items
    
    // Add delivery fee
    line_items.push({
      price_data: {
        currency: "lkr",
        product_data: { name: "Delivery Charges" },
        unit_amount: 15000 // 150 LKR in cents
      },
      quantity: 1
    });
    
    console.log("Creating Stripe session with line items:", line_items.length);
    
    try {      const session = await stripe.checkout.sessions.create({
        line_items,
        mode: "payment",
        success_url: `${frontend_url}/verify?success=true&orderId=${orderId}`,
        cancel_url: `${frontend_url}/verify?success=false&orderId=${orderId}`,
        metadata: { order_id: orderId }
      });
      
      console.log(`Stripe session created: ${session.id}`);
      
      res.json({ 
        success: true, 
        url: session.url,
        orderId
      });
    } catch (stripeError) {
      console.error("Stripe session creation error:", stripeError);
      
      // Order was created but payment failed - update the order status
      await Order.updatePaymentStatus(orderId, false);
      
      res.status(500).json({
        success: false,
        message: "Error creating payment session",
        error: process.env.NODE_ENV === 'development' ? stripeError.message : undefined,
        orderId // Return the order ID even if payment fails
      });
    }
    
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error while placing order",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      await Order.updatePaymentStatus(orderId, true);
      res.json({
        success: true,
        message: "Payment verified successfully"
      });
    } else {
      await Order.updatePaymentStatus(orderId, false);
      res.json({
        success: false,
        message: "Payment verification failed"
      });
    }
  } catch (error) {
    console.error("Verify order error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment"
    });
  }
};

//User orders for the frontend
const userOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching orders for user ${userId}`);

    // Get all orders for this user
    const orders = await Order.findByUserId(userId);
    
    // For each order, get detailed information including items
    const detailedOrders = await Promise.all(
      orders.map(async (order) => {
        const fullOrder = await Order.findById(order.id);
        return {
          id: fullOrder.id,
          amount: fullOrder.amount,
          address: fullOrder.address,
          status: fullOrder.status,
          payment: fullOrder.payment,
          firstName: fullOrder.first_name,
          lastName: fullOrder.last_name,
          contactNumber1: fullOrder.contact_number1,
          contactNumber2: fullOrder.contact_number2,
          specialInstructions: fullOrder.special_instructions,
          created_at: fullOrder.created_at,
          updated_at: fullOrder.updated_at,
          items: fullOrder.items || []
        };
      })
    );
    
    console.log(`Found ${detailedOrders.length} orders for user ${userId}`);
    
    res.json({
      success: true,
      data: detailedOrders
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders"
    });
  }
};

//Listing orders for the Admin Panel
const listOrders = async (req, res) => {
  try {
    // Get query parameters for filtering
    const { status, payment, sort = 'created_at', order = 'desc', page = 1, limit = 20 } = req.query;
    
    console.log(`Admin fetching orders with filters: status=${status}, payment=${payment}`);
    
    // Get orders with optional filters
    const orders = await Order.listAll({
      status,
      payment: payment === 'true' ? true : payment === 'false' ? false : undefined,
      sort,
      order,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    // Get total count for pagination
    const total = await Order.countAll({
      status,
      payment: payment === 'true' ? true : payment === 'false' ? false : undefined
    });
    
    console.log(`Found ${orders.length} orders out of ${total} total`);
    
    // Format response with pagination info
    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error listing orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders list"
    });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders };