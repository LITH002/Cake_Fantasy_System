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
    // Prevent adding undefined or null items
    if (id === undefined || id === null) {
      console.error("Attempted to add undefined/null item to cart");
      return;
    }

    try {
      // Update local state first for immediate UI response
      setCartItems((prev) => ({
        ...prev,
        [id]: (prev[id] || 0) + 1,
      }));

      if (token) {
        setLoading(true);
        await axios.post(
          `${url}/api/cart/add`,
          { id: id, quantity: 1 },
          { headers: { token: token } } 
        );
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      setError(err.response?.data?.message || "Failed to add item to cart");
      // Revert local state if API call fails
      setCartItems((prev) => ({
        ...prev,
        [id]: Math.max(0, (prev[id] || 0) - 1),
      }));
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemID) => {
    try {
      setCartItems((prev) => ({
        ...prev,
        [itemID]: Math.max(0, (prev[itemID] || 0) - 1),
      }));
  
      if (token) {
        setLoading(true);
        await axios.post(
          `${url}/api/cart/remove`,
          { itemId: itemID },  // Using itemId as expected by backend
          { headers: { token: token } }
        );
      }
    } catch (err) {
      console.error("Error removing from cart:", err);
      setError(
        err.response?.data?.message || "Failed to remove item from cart"
      );
      // Revert local state if API call fails
      setCartItems((prev) => ({
        ...prev,
        [itemID]: (prev[itemID] || 0) + 1,
      }));
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
      const response = await axios.post(
        `${url}/api/cart/get`,
        {},
        { headers: { token: token } }
      );
      
      if (response.data.success && response.data.data) {
        const cartData = {};
        response.data.data.forEach(item => {
          cartData[item.item_id] = item.quantity;
        });
        setCartItems(cartData);
      }
    } catch (err) {
      console.error("Error fetching user cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      await fetchItemList();
      if (localStorage.getItem("token")) {
        const savedToken = localStorage.getItem("token");
        setToken(savedToken);
      }
    }
    loadData();
  }, []);

  // Fetch user cart when token changes
  useEffect(() => {
    if (token) {
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