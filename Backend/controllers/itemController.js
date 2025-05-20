import db from "../config/db.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUpload.js";
import { generateSKU } from "../models/itemModel.js";

// Add Item
const addItem = async (req, res) => {
    try {
        const { 
            name, 
            description, 
            category, 
            barcode, 
            customSKU, 
            cost_price,
            selling_price,
            unit,
            is_loose,
            min_order_quantity,
            increment_step,
            weight_value,
            weight_unit,
            pieces_per_pack,
            reorder_level
        } = req.body;

        // Validate required fields
        if (!name || !category) {
            return res.status(400).json({ 
                success: false,
                message: "Name and category are required" 
            });
        }

        // Generate or validate SKU
        let sku;
        if (barcode) {
            // Check if barcode is already in use
            const [existingBarcode] = await db.query(
                "SELECT id FROM items WHERE barcode = ? OR sku = ? LIMIT 1",
                [barcode, barcode]
            );
            
            if (existingBarcode.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Barcode already in use"
                });
            }
            
            sku = barcode; // Use barcode as SKU
        } else if (customSKU) {
            // Check if custom SKU is already in use
            const [existingSKU] = await db.query(
                "SELECT id FROM items WHERE sku = ? LIMIT 1",
                [customSKU]
            );
            
            if (existingSKU.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Custom SKU already in use"
                });
            }
            
            sku = customSKU;
        } else {
            // Generate a new SKU
            sku = await generateSKU(category);
        }

        // Default values and type conversions
        const costPrice = parseFloat(cost_price) || 0;
        const sellingPrice = parseFloat(selling_price) || costPrice;
        const reorderQty = parseInt(reorder_level) || 5;
        const isLoose = is_loose === 'true' || is_loose === true;
        const minOrderQty = parseFloat(min_order_quantity) || (isLoose ? 10 : 1);
        const incrementStep = parseFloat(increment_step) || (isLoose ? 5 : 1);
        const weightVal = weight_value ? parseFloat(weight_value) : null;
        const piecesPerPk = pieces_per_pack ? parseInt(pieces_per_pack) : null;
        
        // Validate weight unit if weight value is provided
        let weightUnitValue = null;
        if (weightVal) {
            if (weight_unit && (weight_unit === 'g' || weight_unit === 'ml')) {
                weightUnitValue = weight_unit;
            } else {
                // Default weight unit based on category
                weightUnitValue = category.toLowerCase().includes('liquid') ? 'ml' : 'g';
            }
        }

        let imageUrl = null;
        let cloudinaryId = null;

        // Upload image to Cloudinary if provided
        if (req.file) {
            const imageResult = await uploadToCloudinary(req.file.buffer);
            imageUrl = imageResult.secure_url;
            cloudinaryId = imageResult.public_id;
        }

        // Save item in the database
        const [result] = await db.query(
            `INSERT INTO items (
                name, 
                description, 
                category, 
                sku, 
                barcode, 
                cost_price, 
                selling_price,
                unit,
                is_loose,
                min_order_quantity,
                increment_step,
                weight_value,
                weight_unit,
                pieces_per_pack,
                reorder_level,
                image, 
                cloudinary_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, 
                description || '', 
                category, 
                sku, 
                barcode || null, 
                costPrice, 
                sellingPrice,
                unit || 'piece',
                isLoose,
                minOrderQty,
                incrementStep,
                weightVal,
                weightUnitValue,
                piecesPerPk,
                reorderQty,
                imageUrl, 
                cloudinaryId
            ]
        );

        res.status(201).json({ 
            success: true,
            message: "Item added successfully", 
            itemId: result.insertId,
            sku: sku,
            imageUrl: imageUrl
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
        const [results] = await db.query(
            "SELECT * FROM items WHERE disabled = FALSE OR disabled IS NULL"
        );

        
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

// Get item details
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

        // Get the item's average rating from reviews
        const [reviews] = await db.query(
            `SELECT AVG(rating) as average_rating 
            FROM reviews 
            WHERE item_id = ?`,
            [itemId]
        );

        // Add rating to the item data
        const itemData = items[0];
        itemData.rating = reviews[0].average_rating || 0;
        
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
const updateItem = async (req, res) => {
    try {
        const { 
            item_id, 
            name, 
            description, 
            category, 
            barcode, 
            customSKU, 
            cost_price,
            selling_price,
            unit,
            is_loose,
            min_order_quantity,
            increment_step,
            weight_value,
            weight_unit,
            pieces_per_pack,
            reorder_level
        } = req.body;
        
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
        const updatedName = name || currentItem.name;
        const updatedDescription = description !== undefined ? description : currentItem.description;
        const updatedCategory = category || currentItem.category;
        const updatedCostPrice = cost_price ? parseFloat(cost_price) : currentItem.cost_price;
        const updatedSellingPrice = selling_price ? parseFloat(selling_price) : currentItem.selling_price;
        
        // Unit-related properties with defaults from current values
        const updatedUnit = unit || currentItem.unit;
        const updatedIsLoose = is_loose !== undefined ? 
            (is_loose === 'true' || is_loose === true) : 
            currentItem.is_loose;
        const updatedMinOrderQty = min_order_quantity !== undefined ? 
            parseFloat(min_order_quantity) : 
            currentItem.min_order_quantity;
        const updatedIncrementStep = increment_step !== undefined ? 
            parseFloat(increment_step) : 
            currentItem.increment_step;
        const updatedWeightValue = weight_value !== undefined ?
            (weight_value ? parseFloat(weight_value) : null) :
            currentItem.weight_value;
        const updatedWeightUnit = weight_unit || currentItem.weight_unit;
        const updatedPiecesPack = pieces_per_pack !== undefined ?
            (pieces_per_pack ? parseInt(pieces_per_pack) : null) :
            currentItem.pieces_per_pack;
        const updatedReorderLevel = reorder_level !== undefined ?
            parseInt(reorder_level) : 
            currentItem.reorder_level;
        
        // Handle SKU/barcode update
        let updatedSKU = currentItem.sku;
        let updatedBarcode = currentItem.barcode;
        
        if (barcode && barcode !== currentItem.barcode) {
            // Check if new barcode is already in use
            const [existingBarcode] = await db.query(
                "SELECT id FROM items WHERE (barcode = ? OR sku = ?) AND id != ? LIMIT 1",
                [barcode, barcode, item_id]
            );
            
            if (existingBarcode.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Barcode already in use by another item"
                });
            }
            
            updatedBarcode = barcode;
        }
        
        if (customSKU && customSKU !== currentItem.sku) {
            // Check if new custom SKU is already in use
            const [existingSKU] = await db.query(
                "SELECT id FROM items WHERE sku = ? AND id != ? LIMIT 1",
                [customSKU, item_id]
            );
            
            if (existingSKU.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Custom SKU already in use by another item"
                });
            }
            
            updatedSKU = customSKU;
        }

        // If a new image is uploaded, update it in Cloudinary
        let updatedImageUrl = currentItem.image;
        let updatedCloudinaryId = currentItem.cloudinary_id;
        
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
            updatedImageUrl = cloudinaryResult.secure_url;
            updatedCloudinaryId = cloudinaryResult.public_id;
        }

        // Update the item in the database with all fields
        await db.query(
            `UPDATE items SET 
                name = ?, 
                description = ?,
                category = ?,
                sku = ?,
                barcode = ?,
                cost_price = ?,
                selling_price = ?,
                unit = ?,
                is_loose = ?,
                min_order_quantity = ?,
                increment_step = ?,
                weight_value = ?,
                weight_unit = ?,
                pieces_per_pack = ?,
                reorder_level = ?,
                image = ?,
                cloudinary_id = ?
            WHERE id = ?`,
            [
                updatedName,
                updatedDescription,
                updatedCategory,
                updatedSKU,
                updatedBarcode,
                updatedCostPrice,
                updatedSellingPrice,
                updatedUnit,
                updatedIsLoose,
                updatedMinOrderQty,
                updatedIncrementStep,
                updatedWeightValue,
                updatedWeightUnit,
                updatedPiecesPack,
                updatedReorderLevel,
                updatedImageUrl,
                updatedCloudinaryId,
                item_id
            ]
        );

        res.json({ 
            success: true, 
            message: "Item updated successfully",
            sku: updatedSKU,
            imageUrl: updatedImageUrl
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

// Generate barcode/label for printing
const generateBarcode = async (req, res) => {
    try {
        const { item_id } = req.params;
        
        // Get item details
        const [items] = await db.query(
            "SELECT id, name, sku, barcode, category, selling_price FROM items WHERE id = ?",
            [item_id]
        );
        
        if (!items.length) {
            return res.status(404).json({
                success: false,
                message: "Item not found"
            });
        }
        
        const item = items[0];
        
        // Return data needed for barcode generation
        res.json({
            success: true,
            data: {
                id: item.id,
                name: item.name,
                sku: item.sku,
                barcode: item.barcode || item.sku, // Use SKU if no barcode
                category: item.category,
                selling_price: item.selling_price
            }
        });
    } catch (error) {
        console.error("Error generating barcode data:", error);
        res.status(500).json({
            success: false,
            message: "Error generating barcode data",
            error: error.message
        });
    }
};

export { addItem, listItem, removeItem, updateItem, getItem, generateBarcode };