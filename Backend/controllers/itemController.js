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

// Get item to update
const getItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        
        const [items] = await db.query(
            "SELECT * FROM items WHERE id = ?", 
            [itemId]
        );
        
        if (!items.length) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found" 
            });
        }
        
        res.json({ 
            success: true, 
            data: items[0] 
        });
    } catch (error) {
        console.error("Error fetching item:", error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching item",
            error: error.message 
        });
    }
};

// Update Item
// Update Item
const updateItem = async (req, res) => {
    try {
        const { item_id } = req.body;
        let { name, description, price } = req.body;
        let cloudinaryResult = null;

        if (!item_id) {
            return res.status(400).json({ 
                success: false,
                message: "Item ID is required" 
            });
        }

        // Check if item exists and get current values
        const [items] = await db.query(
            "SELECT * FROM items WHERE id = ?", 
            [item_id]
        );

        if (!items.length) {
            return res.status(404).json({ 
                success: false, 
                message: "Item not found" 
            });
        }

        // Use existing values if not provided in the request
        const currentItem = items[0];
        name = name || currentItem.name;
        description = description || currentItem.description;
        price = price || currentItem.price;
        const category = currentItem.category; // Always use existing category

        // If a new image is uploaded, update it in Cloudinary
        if (req.file) {
            // Delete old image from Cloudinary if it exists
            if (currentItem.cloudinary_id) {
                try {
                    await deleteFromCloudinary(currentItem.cloudinary_id);
                } catch (cloudinaryErr) {
                    console.error("Error deleting old image from Cloudinary:", cloudinaryErr);
                    // Continue anyway
                }
            }
            
            // Upload new image to Cloudinary
            cloudinaryResult = await uploadToCloudinary(req.file.buffer);
        }

        // Update the item in the database
        const updateQuery = cloudinaryResult
            ? "UPDATE items SET name = ?, description = ?, price = ?, image = ?, cloudinary_id = ? WHERE id = ?"
            : "UPDATE items SET name = ?, description = ?, price = ? WHERE id = ?";
        
        const updateParams = cloudinaryResult
            ? [name, description, price, cloudinaryResult.secure_url, cloudinaryResult.public_id, item_id]
            : [name, description, price, item_id];

        await db.query(updateQuery, updateParams);

        res.json({ 
            success: true, 
            message: "Item updated successfully",
            imageUrl: cloudinaryResult ? cloudinaryResult.secure_url : currentItem.image
        });

    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ 
            success: false,
            message: "Error updating item",
            error: error.message 
        });
    }
};

export { addItem, listItem, removeItem, updateItem, getItem };