import db from "../config/db.js";
import fs from "fs";
import { promisify } from "util";

// Convert callback-based functions to promises
const unlinkAsync = promisify(fs.unlink);

// Add Item
const addItem = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;
        const image_filename = req.file?.filename;

        if (!name || !description || !price || !category || !image_filename) {
            return res.status(400).json({ 
                success: false,
                message: "All fields are required" 
            });
        }

        const [result] = await db.query(
            "INSERT INTO items (name, description, price, image, category) VALUES (?, ?, ?, ?, ?)",
            [name, description, price, image_filename, category]
        );

        res.status(201).json({ 
            success: true,
            message: "Item added successfully", 
            itemId: result.insertId 
        });

    } catch (error) {
        console.error("Error adding item:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error",
            error: error.message 
        });
    }
};

// List All Items
const listItem = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM items");
        res.json({ 
            success: true, 
            data: results 
        });
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching items",
            error: error.message 
        });
    }
};

// Remove Item
const removeItem = async (req, res) => {
    try {
        const itemId = req.body.id;

        if (!itemId) {
            return res.status(400).json({ 
                success: false, 
                message: "Item ID is required" 
            });
        }

        // Get the item's image filename
        const [results] = await db.query("SELECT image FROM items WHERE id = ?", [itemId]);
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found" 
            });
        }

        const image_filename = results[0].image;

        // Delete the image file if it exists
        try {
            await unlinkAsync(`uploads/${image_filename}`);
        } catch (unlinkErr) {
            if (unlinkErr.code !== "ENOENT") { // Ignore "file not found" errors
                console.error("Error deleting image:", unlinkErr);
            }
        }

        // Delete the item from database
        await db.query("DELETE FROM items WHERE id = ?", [itemId]);

        res.json({ 
            success: true, 
            message: "Item removed successfully" 
        });

    } catch (error) {
        console.error("Error removing item:", error);
        res.status(500).json({ 
            success: false,
            message: "Error removing item",
            error: error.message 
        });
    }
};

export { addItem, listItem, removeItem };