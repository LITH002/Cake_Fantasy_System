import { createContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = "http://localhost:4000";
  const [token, setToken] = useState("");
  const [item_list, setItemList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addToCart = async (id) => {
    if (!id) return;

    try {
      const newQuantity = (cartItems[id] || 0) + 1;
      setCartItems(prev => ({ ...prev, [id]: newQuantity }));

      if (token) {
        setLoading(true);
        const response = await axios.post(
          `${url}/api/cart/add`,
          { 
            item_id: id,
            quantity: 1 
          },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        if (!response.data.success) {
          throw new Error(response.data.message);
        }
      }
    } catch (err) {
      console.error("Cart error:", {
        error: err,
        response: err.response?.data
      });
      
      setCartItems(prev => ({
        ...prev,
        [id]: Math.max(0, (prev[id] || 0) - 1)
      }));
      
      setError(err.response?.data?.message || "Failed to add item");
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
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        // Try multiple ID formats (string and number comparison)
        let itemInfo = item_list.find(
          (product) =>
            String(product._id) === String(item) ||
            product.id === item ||
            String(product.id) === String(item)
        );

        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[item];
        } else {
          console.warn(
            `Item ${item} not found in item_list. Available IDs:`,
            item_list.map((i) => `_id:${i._id}, id:${i.id}`).slice(0, 3)
          );

          setCartItems((prev) => {
            const newCart = { ...prev };
            delete newCart[item];
            return newCart;
          });
        }
      }
    }
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

  const fetchUserCart = async () => {
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
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common['Authorization'];
    setToken("");
    setCartItems({});
  };

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
  }, [token]);

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