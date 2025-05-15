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

// List Items
const listItem = async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM items");
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

// Remove Item
const removeItem = async (req, res) => {
    try {
        const itemId = req.body.item_id;

        if (!itemId) {
            return res.status(400).json({ 
                success: false, 
                message: "Item ID is required" 
            });
        }

        // Get the item to find its Cloudinary ID
        const [items] = await db.query(
            "SELECT cloudinary_id FROM items WHERE id = ?", 
            [itemId]
        );

        if (!items.length) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found" 
            });
        }

        const cloudinary_id = items[0].cloudinary_id;

        // Delete from Cloudinary if we have an ID
        if (cloudinary_id) {
            try {
                await deleteFromCloudinary(cloudinary_id);
                console.log(`Deleted image ${cloudinary_id} from Cloudinary`);
            } catch (cloudinaryErr) {
                console.error("Error deleting from Cloudinary:", cloudinaryErr);
                // Continue with deletion even if Cloudinary fails
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