import { GRN } from "../models/grnModel.js";

// Create new GRN
export const createGRN = async (req, res) => {
  try {
    const { supplier_id, po_reference, received_date, notes, items } = req.body;
    
    // Validate required fields
    if (!supplier_id || !received_date || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }
    
    // Validate items format
    for (const item of items) {
      if (!item.item_id || !item.received_quantity || !item.unit_price) {
        return res.status(400).json({
          success: false,
          message: "Each item must have item_id, received_quantity, and unit_price"
        });
      }
    }
    
    const result = await GRN.create({
      supplier_id,
      po_reference,
      received_date,
      received_by: req.user.id, // From auth middleware
      notes
    }, items); // Items now can include selling_price
    
    res.status(201).json({
      success: true,
      message: "GRN created successfully",
      data: result
    });
  } catch (error) {
    console.error("Error creating GRN:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create GRN",
      error: error.message
    });
  }
};

// Complete GRN and update inventory
export const completeGRN = async (req, res) => {
  try {
    const { id } = req.params;
    
    const grn = await GRN.findById(id);
    if (!grn) {
      return res.status(404).json({
        success: false,
        message: "GRN not found"
      });
    }
    
    if (grn.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `GRN is already ${grn.status}`
      });
    }
    
    await GRN.complete(id);
    
    res.json({
      success: true,
      message: "GRN approved and inventory updated successfully"
    });
  } catch (error) {
    console.error("Error completing GRN:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete GRN",
      error: error.message
    });
  }
};

// Get GRN by ID
export const getGRNById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const grn = await GRN.findById(id);
    if (!grn) {
      return res.status(404).json({
        success: false,
        message: "GRN not found"
      });
    }
    
    // Transform GRN data for frontend
    const formattedGRN = {
      id: grn.id,
      reference_number: grn.reference_number || grn.grn_number,
      supplier_id: grn.supplier_id,
      created_at: grn.created_at,
      updated_at: grn.updated_at,
      received_date: grn.received_date,
      notes: grn.notes,
      received_by: grn.received_by,
      received_by_name: grn.received_by_name,
      total_amount: parseFloat(grn.total_amount || 0),
      
      // Transform items to match frontend expectations
      items: grn.items.map(item => ({
        id: item.id,
        item_id: item.item_id,
        name: item.item_name || item.name,
        quantity: item.received_quantity,
        unit_price: parseFloat(item.unit_price),
        selling_price: item.selling_price ? parseFloat(item.selling_price) : null,
        sku: item.sku,
        image: item.image,
        unit: item.unit
      }))
    };
    
    res.json({
      success: true,
      data: formattedGRN
    });
  } catch (error) {
    console.error("Error fetching GRN:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve GRN",
      error: error.message
    });
  }
};

// List all GRNs with filtering
// Update your listGRNs controller method:
export const listGRNs = async (req, res) => {
  try {
    console.log("GRN list endpoint hit with query:", req.query);
    
    const { 
      status, 
      supplier_id, 
      startDate, 
      endDate,
      page = 1,
      limit = 10
    } = req.query;
    
    // Build filter object for the model
    const filters = {
      status,
      supplier_id,
      startDate,
      endDate,
      page,
      limit
    };
    
    // Call the model method with the filters
    let result;
    try {
      result = await GRN.findAll(filters);
      console.log("GRN.findAll returned:", result);
    } catch (modelError) {
      console.error("Error in GRN.findAll:", modelError);
      return res.status(500).json({
        success: false,
        message: "Database error retrieving GRNs",
        error: modelError.message
      });
    }
    
    // Your GRN model returns data in a different format than your controller expects
    // The GRN model returns { data: [...], pagination: {...} }
    // Let's adapt the controller to use this format
    if (!result || !result.data) {
      console.log("No GRNs found or result structure is incorrect");
      return res.json({
        success: true,
        data: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          pageSize: parseInt(limit)
        }
      });
    }
    
    // Process the GRNs with safety checks
    const normalizedGRNs = result.data.map(grn => ({
      id: grn.id,
      reference_number: grn.grn_number || 'N/A',
      supplier_id: grn.supplier_id,
      supplier_name: grn.supplier_name,
      created_at: grn.created_at,
      updated_at: grn.updated_at,
      received_date: grn.received_date,
      status: grn.status || 'pending',
      notes: grn.notes || '',
      received_by: grn.received_by,
      received_by_name: grn.received_by_name || '',
      total_amount: parseFloat(grn.total_amount || 0),
      item_count: grn.items_count || 0
    }));
    
    res.json({
      success: true,
      data: normalizedGRNs,
      pagination: {
        totalItems: result.pagination.total,
        totalPages: result.pagination.totalPages,
        currentPage: result.pagination.page,
        pageSize: result.pagination.limit
      }
    });
  } catch (error) {
    console.error("Error listing GRNs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve GRN list",
      error: error.message
    });
  }
};

// Cancel GRN
export const cancelGRN = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await GRN.cancel(id);
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: "GRN not found or cannot be rejected"
      });
    }
    
    res.json({
      success: true,
      message: "GRN rejected successfully"
    });
  } catch (error) {
    console.error("Error cancelling GRN:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel GRN",
      error: error.message
    });
  }
};

export const updateGRNStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`Received request to update GRN #${id} status to ${status}`);
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status provided"
      });
    }
    
    const grn = await GRN.findById(id);
    if (!grn) {
      return res.status(404).json({
        success: false,
        message: "GRN not found"
      });
    }
    
    console.log(`Current GRN status: ${grn.status}`);
    
    if (grn.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `GRN is already ${grn.status}`
      });
    }
    
    // Update the GRN status
    const result = await GRN.updateStatus(id, status, req.user.id);
    
    // Verify the update by fetching the updated GRN
    const updatedGrn = await GRN.findById(id);
    console.log(`GRN after update: Status = ${updatedGrn ? updatedGrn.status : 'unknown'}`);
    
    if (result && updatedGrn && updatedGrn.status === status) {
      res.json({
        success: true,
        message: `GRN ${status} successfully`,
        data: {
          id: updatedGrn.id,
          status: updatedGrn.status
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update GRN status"
      });
    }
  } catch (error) {
    console.error(`Error updating GRN status:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to update GRN status",
      error: error.message
    });
  }
};