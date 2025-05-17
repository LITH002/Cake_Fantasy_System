import db from "../config/db.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";

// Add Item
const addItem = async (req, res) => {
    try {
        const { name, description, price, category } = req.body;

        if (!name || !description || !price || !category || !req.file) {
            return res.status(400).json({ 
                success: false,
                message: "All fields are required" 
            });
        }

        // Upload image to Cloudinary
        const imageResult = await uploadToCloudinary(req.file.buffer);

        // Save Cloudinary details in the database
        const [result] = await db.query(
            "INSERT INTO items (name, description, price, image, category, cloudinary_id) VALUES (?, ?, ?, ?, ?, ?)",
            [name, description, price, imageResult.secure_url, category, imageResult.public_id]
        );

        res.status(201).json({ 
            success: true,
            message: "Item added successfully", 
            itemId: result.insertId,
            imageUrl: imageResult.secure_url
        });

    } catch (error) {
        console.error("Error adding item:", error);
        res.status(500).json({ 
            success: false,
            message: "Error adding item",
            error: error.message 
        });
    }
};

// List Items (returns non-disabled items)
const listItem = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM items WHERE disabled = FALSE OR disabled IS NULL");
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error listing items:", error);
        res.status(500).json({ 
            success: false,
            message: "Error listing items",
            error: error.message 
        });
    }
};

// Remove Item (soft delete)
const removeItem = async (req, res) => {
    try {
        const itemId = req.body.item_id;

        if (!itemId) {
            return res.status(400).json({ 
                success: false, 
                message: "Item ID is required" 
            });
        }

        // Check if item exists
        const [items] = await db.query(
            "SELECT id FROM items WHERE id = ?", 
            [itemId]
        );

        if (!items.length) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found" 
            });
        }

        // Marking the item as disabled 
        await db.query(
            "UPDATE items SET disabled = TRUE WHERE id = ?", 
            [itemId]
        );

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