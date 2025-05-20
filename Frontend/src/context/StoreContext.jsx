import { createContext, useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = "http://localhost:4000";
  const [token, setToken] = useState("");
  const [item_list, setItemList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const addToCart = async (id, quantity = 1) => {
    if (!id) {
      console.error("Invalid item ID");
      return;
    }
    
    if (!token) {
      toast.error("Please login to add items to cart");
      return;
    }
    
    setLoading(true);
    
    try {
      // For direct cart updates from product detail, use the exact quantity
      const newQuantity = quantity;
      
      // Update local state for immediate UI feedback
      setCartItems(prev => ({
        ...prev,
        [id]: newQuantity
      }));
      
      console.log(`Updated local cart: Item ${id} quantity set to ${newQuantity}`);
      
      // The API call is now handled by the component itself
      return true;
    } catch (err) {
      console.error("Cart error:", err);
      
      // Revert the local state change on error
      setCartItems(prev => {
        const previousQty = prev[id] || 0;
        return {
          ...prev,
          [id]: previousQty
        };
      });
      
      setError("Failed to update cart");
      toast.error("Failed to update cart");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
  if (!itemId) {
    console.error("Invalid item ID for removal");
    return;
  }
  
  setLoading(true);
  
  try {
    const currentQuantity = cartItems[itemId] || 0;
    if (currentQuantity <= 0) {
      console.warn(`Item ${itemId} already has 0 quantity`);
      setLoading(false);
      return;
    }
    
    const newQuantity = currentQuantity - 1;
    console.log(`Reducing quantity of item ${itemId} from ${currentQuantity} to ${newQuantity}`);
    
    // Update local state optimistically
    setCartItems((prev) => ({
      ...prev,
      [itemId]: newQuantity,
    }));

    // Update server if logged in
    if (token) {
      if (newQuantity > 0) {
        // For updating quantity, use POST /api/cart/add with the new quantity
        console.log(`Updating item ${itemId} quantity to ${newQuantity}`);
        const response = await axios.post(
          `${url}/api/cart/add`,
          { 
            item_id: itemId,
            quantity: newQuantity // Set the total new quantity, not just the increment
          },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to update cart");
        }
      } else {
        // For removing item, use POST /api/cart/remove
        console.log(`Removing item ${itemId} from cart`);
        const response = await axios.post(
          `${url}/api/cart/remove`,
          { item_id: itemId },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to remove from cart");
        }
      }
    }
  } catch (err) {
    console.error("Error removing from cart:", err);
    // Revert on error
    setCartItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
    
    setError(err.message || "Failed to update cart");
  } finally {
    setLoading(false);
  }
};
  const getTotalCartAmount = () => {
    // Check if item_list is loaded and not empty
    if (!item_list || item_list.length === 0) {
      console.log("Item list is empty, cannot calculate cart total");
      return 0;
    }

    let totalAmount = 0;
    for (const itemId in cartItems) {
      if (cartItems[itemId] > 0) {
        // Try multiple ID formats (string and number comparison)
        let itemInfo = item_list.find(
          (product) =>
            String(product._id) === String(itemId) ||
            product.id === itemId ||
            String(product.id) === String(itemId)
        );

        if (itemInfo) {
          // Ensure valid price and quantity for calculation
          const itemPrice = parseFloat(itemInfo.price || itemInfo.selling_price || 0);
          const quantity = parseFloat(cartItems[itemId]);
          
          if (!isNaN(itemPrice) && !isNaN(quantity) && itemPrice > 0 && quantity > 0) {
            const itemTotal = itemPrice * quantity;
            totalAmount += itemTotal;
            console.log(`Item ${itemId}: ${quantity} x ${itemPrice} = ${itemTotal}`);
          } else {
            console.warn(
              `Invalid price (${itemPrice}) or quantity (${quantity}) for item ${itemId}`
            );
          }
        } else {
          console.warn(
            `Item ${itemId} not found in item_list. Available IDs:`,
            item_list.map((i) => `_id:${i._id}, id:${i.id}`).slice(0, 3)
          );

          // Remove invalid item from cart
          setCartItems((prev) => {
            const newCart = { ...prev };
            delete newCart[itemId];
            return newCart;
          });
        }
      }
    }
    
    console.log(`Total cart amount: ${totalAmount}`);
    return totalAmount;
  };
  const fetchItemList = async () => {
    try {
      const response = await axios.get(url + "/api/item/list");
      setItemList(response.data.data);
    } catch (err) {
      console.error("Error fetching item list:", err);
      setError(err.response?.data?.message || "Failed to fetch items");
    }
  };
  
  // Define logout function first to avoid reference error
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common['Authorization'];
    setToken("");
    setCartItems({});
  }, []);
  
  // Then define fetchUserCart which uses logout
  const fetchUserCart = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${url}/api/cart`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Cart response:", response.data);
      
      if (response.data.success) {
        const cartData = {};
        const items = response.data.data?.items || response.data.data || [];
        
        if (items.length === 0) {
          console.log("Cart is empty from server");
        }
        
        items.forEach(item => {
          // Make sure we have the correct ID field
          const itemId = item.item_id || item.id || item._id;
          if (itemId) {
            cartData[itemId] = item.quantity;
            console.log(`Added item ${itemId} with quantity ${item.quantity} to cart`);
          } else {
            console.warn("Item without ID in cart response:", item);
          }
        });
        
        setCartItems(cartData);
      } else {
        console.warn("Cart fetch response not successful:", response.data);
      }
    } catch (err) {
      console.error("Error fetching user cart:", err);
      if (err.response?.status === 401) {
        // Token is invalid, force logout
        console.warn("Unauthorized cart access, logging out");
        logout();
      }
      setError(err.response?.data?.message || "Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, [token, url, logout]);

  const getUserId = () => {
    if (!token) return null;
    try {
      const tokenPayload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(tokenPayload));
      return decodedPayload.id;
    } catch (error) {
      console.error("Error extracting user ID from token:", error);
      return null;
    }
  };

  // Load initial data - item list and saved token
  useEffect(() => {
    async function loadData() {
      await fetchItemList();
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        console.log("Found saved token, setting auth headers");
        setToken(savedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      }
    }
    loadData();
  }, []);
  // Fetch cart when token changes
  useEffect(() => {
    if (token) {
      console.log("Token available - fetching cart data");
      fetchUserCart();
    }
  }, [token, fetchUserCart]);

  const contextValue = {
    item_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    token,
    setToken,
    loading,
    error,
    logout,
    getUserId,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

StoreContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default StoreContextProvider;