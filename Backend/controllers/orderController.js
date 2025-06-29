import { Order } from "../models/orderModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const frontend_url = "http://localhost:5173";

const prepareLineItems = (items) => {
  if (!items?.length) {
    console.error("No items provided for Stripe checkout");
    return [];
  }

  console.log("RAW ITEMS RECEIVED:", JSON.stringify(items, null, 2));

  return items.map(item => {
    // Validate required fields
    if (!item.id || !item.name || (item.selling_price === undefined && item.price === undefined)) {
      console.error("Invalid item missing required fields:", item);
      return null;
    }

    const price = parseFloat(item.selling_price || item.price);
    const quantity = parseInt(item.quantity) || 1;

    if (isNaN(price)) {
      console.error(`Invalid price for item ${item.id}: ${price}`);
      return null;
    }

    return {
      price_data: {
        currency: "lkr",
        product_data: { 
          name: item.name,
          description: item.description || undefined,
          images: item.image ? [item.image] : undefined
        },
        unit_amount: Math.round(price * 100) // Convert to cents
      },
      quantity
    };
  }).filter(Boolean);
};

const placeOrder = async (req, res) => {
  try {
    const { items } = req.body;

    // Debug: Verify incoming items
    console.log("Incoming items:", JSON.stringify(items, null, 2));

    // Prepare line items
    const lineItems = prepareLineItems(items);
    console.log("Processed line items:", JSON.stringify(lineItems, null, 2));

    // Add delivery fee
    lineItems.push({
      price_data: {
        currency: "lkr",
        product_data: { name: "Delivery Charges" },
        unit_amount: 15000 // 150 LKR in cents
      },
      quantity: 1
    });

    // Create order in database
    const orderId = await Order.create(
      req.user?.id,
      items,
      req.body.amount,
      req.body.address,
      req.body.firstName,
      req.body.lastName,
      req.body.contactNumber1,
      req.body.contactNumber2,
      req.body.specialInstructions
    );

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${orderId}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${orderId}`,
      metadata: { order_id: orderId },
      client_reference_id: orderId
    });

    res.json({ 
      success: true, 
      url: session.url,
      orderId
    });

  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error processing order",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const verifyOrder = async (req, res) => {
  try {
    const { orderId, success } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }
    
    await Order.updatePaymentStatus(orderId, success === "true");
    res.json({
      success: true,
      message: `Payment ${success === "true" ? 'verified' : 'failed'}`
    });
  } catch (error) {
    console.error("Verify order error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment"
    });
  }
};

const userOrders = async (req, res) => {
  try {
    const orders = await Order.findByUserId(req.user.id);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders"
    });
  }
};

const listOrders = async (req, res) => {
  try {
    const { status, payment, sort = 'created_at', order = 'desc', page = 1, limit = 20 } = req.query;
    
    const orders = await Order.listAll({
      status,
      payment: payment === 'true' ? true : payment === 'false' ? false : undefined,
      sort,
      order,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    const total = await Order.countAll({
      status,
      payment: payment === 'true' ? true : payment === 'false' ? false : undefined
    });
    
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