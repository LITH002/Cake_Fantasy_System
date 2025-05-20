import express from "express";
import cors from "cors";
import db from "./config/db.js";
import itemRouter from "./routes/itemRoute.js";
import { initializeTables as userTables } from "./models/userModel.js";
import createItemTable  from "./models/itemModel.js";
import userRouter from "./routes/userRoute.js";
import 'dotenv/config';
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import { createOrderTables } from "./models/orderModel.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from './routes/adminRoute.js';
import { createAdminTable } from './models/adminModel.js';
import supplierRouter from './routes/supplierRoute.js';
import grnRouter from './routes/grnRoute.js';
import router from "./routes/reviewRoute.js";
import createReviewsTable from "./models/reviewModel.js";

const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());

// Test Database Connection
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1');
    res.json({ message: "Database connected successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database not connected" });
  }
});

// API Endpoints
app.use("/api/item", itemRouter);
app.use("/images", express.static('uploads'));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use('/api/admin', adminRouter);
app.use('/api/supplier', supplierRouter);
app.use('/api/grn', grnRouter);
app.use('/api/review', router);

// Add this temporary debug endpoint
app.get('/debug/user-structure', async (req, res) => {
  try {
    const [columns] = await db.query('SHOW COLUMNS FROM users');
    res.json({
      success: true,
      columns: columns.map(col => col.Field)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching table structure',
      error: error.message
    });
  }
});

// Async server startup
const startServer = async () => {
  try {
    connectCloudinary();
    await Promise.all([
      userTables(),
      createItemTable(),
      createOrderTables(),
      createAdminTable(),
      createReviewsTable()
    ]);
    
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to initialize database tables:", err);
    process.exit(1);
  }
};

startServer();