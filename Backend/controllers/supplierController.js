import { Supplier } from "../models/supplierModel.js";

// Get all suppliers
export const getAllSuppliers = async (req, res) => {
  try {
    const { active } = req.query;
    const suppliers = await Supplier.findAll({ 
      active: active === 'true' || active === undefined // Default to showing active suppliers
    });
    
    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers"
    });
  }
};

// Get supplier by ID
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }
    
    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch supplier"
    });
  }
};

// Create new supplier
export const createSupplier = async (req, res) => {
  try {
    const { name, contact_person, email, phone, address, notes } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required"
      });
    }
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }
    
    // Check for existing supplier with same name
    const existingName = await Supplier.findByName(name);
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: "A supplier with this name already exists"
      });
    }
    
    // Check for existing supplier with same phone
    const existingPhone = await Supplier.findByPhone(phone);
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "A supplier with this phone number already exists"
      });
    }
    
    // Check for existing supplier with same email (if provided)
    if (email) {
      const existingEmail = await Supplier.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "A supplier with this email already exists"
        });
      }
    }
    
    // Create the supplier
    const supplierId = await Supplier.create({
      name,
      contact_person,
      email,
      phone,
      address,
      notes
    });
    
    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: { id: supplierId }
    });
  } catch (error) {
    console.error("Error creating supplier:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create supplier: " + (error.message || "Unknown error")
    });
  }
};

// Update updateSupplier function
export const updateSupplier = async (req, res) => {
  try {
    const { supplier_id } = req.body; // Get ID from request body instead of params
    const { name, contact_person, email, phone, address, notes, is_active } = req.body;
    
    // Validate required fields
    if (!supplier_id) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID is required"
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required"
      });
    }
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }
    
    // First check if the supplier exists
    const existingSupplier = await Supplier.findById(supplier_id);
    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }
    
    // Update the supplier
    await Supplier.update(supplier_id, {
      name,
      contact_person,
      email,
      phone,
      address,
      notes,
      is_active: is_active !== undefined ? is_active : true
    });
    
    // Return success regardless of whether data was changed
    res.json({
      success: true,
      message: "Supplier updated successfully"
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update supplier: " + (error.message || "Unknown error")
    });
  }
};

// Delete supplier (soft delete)
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await Supplier.delete(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }
    
    res.json({
      success: true,
      message: "Supplier deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete supplier"
    });
  }
};

// For handling delete requests with request body instead of URL params
export const removeSupplier = async (req, res) => {
  try {
    const { supplier_id } = req.body;
    
    if (!supplier_id) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID is required"
      });
    }
    
    const success = await Supplier.delete(supplier_id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }
    
    res.json({
      success: true,
      message: "Supplier deleted successfully"
    });
  } catch (error) {
    console.error("Error removing supplier:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove supplier"
    });
  }
};