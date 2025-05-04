import { createContext, useState } from "react";
import { item_list } from "../assets/assets";
import PropTypes from 'prop-types';

export const StoreContext = createContext(null)

const StoreContextProvider = (props) => {
    const [cartItems,setCartItems] = useState({});

    const addToCart = (itemID) => {
        if (!cartItems[itemID]) {
            setCartItems((prev)=>({...prev,[itemID]:1}))
        } else {
            setCartItems((prev)=>({...prev,[itemID]:prev[itemID]+1}))
        }
    }

    const removeFromCart = (itemID) => {
        setCartItems((prev)=>({...prev,[itemID]:prev[itemID]-1}))
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for(const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = item_list.find((product)=>product._id === item);
                totalAmount += itemInfo.price * cartItems[item];
            }
        }
        return totalAmount;
    }

    const contextValue = {
        item_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}
StoreContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default StoreContextProvider