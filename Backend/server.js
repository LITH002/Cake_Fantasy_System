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

// Add this to your server.js

// DEBUG: Display all registered routes
app.get('/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Routes registered directly on app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods).join(', ').toUpperCase()
      });
    } else if (middleware.name === 'router') {
      // Routes added via router
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          let base = '';
          if (middleware.regexp) {
            // Extract the base path
            const path = middleware.regexp.toString();
            const match = path.match(/^\/\^\\\/([^\\]+)/);
            if (match) {
              base = '/' + match[1];
            }
          }
          routes.push({
            path: base + handler.route.path,
            methods: Object.keys(handler.route.methods).join(', ').toUpperCase()
          });
        }
      });
    }
  });
  
  res.json({
    count: routes.length,
    routes: routes.sort((a, b) => a.path.localeCompare(b.path))
  });
});

// Async server startup
const startServer = async () => {
  try {
    connectCloudinary();
    await Promise.all([
      userTables(),
      createItemTable(),
      createOrderTables(),
      createAdminTable()
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