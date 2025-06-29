import React, { useContext } from 'react'
import "./Cart.css"
import { StoreContext } from "../../context/StoreContext"
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cartItems, item_list, removeFromCart, getTotalCartAmount, url } = useContext(StoreContext);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    try {
      // Prepare items for checkout
      const checkoutItems = item_list
        .filter(item => cartItems[item.id] > 0)
        .map(item => ({
          id: item.id,
          name: item.name,
          selling_price: item.selling_price,
          quantity: cartItems[item.id],
          image: item.image
        }));

      const response = await fetch(`${url}/api/order/place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items: checkoutItems,
          amount: getTotalCartAmount() + (getTotalCartAmount() === 0 ? 0 : 150),
          address: "User's address", // You should get this from a form
          firstName: "User", // Get from user profile
          lastName: "Name",  // Get from user profile
          contactNumber1: "1234567890" // Get from user profile
        })
      });

      const data = await response.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout failed:', data.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {item_list.map((item, index) => {
          if (cartItems[item.id] > 0) {
            return (
              <div key={item.id}>
                <div className="cart-items-title cart-items-item">
                  <img src={item.image} alt={item.name} />
                  <p>{item.name}</p>
                  <p>LKR {parseFloat(item.selling_price || 0).toFixed(2)}</p>
                  <p>{cartItems[item.id]}</p>
                  <p>LKR {(parseFloat(item.selling_price || 0) * cartItems[item.id]).toFixed(2)}</p>
                  <p onClick={() => removeFromCart(item.id)} className="cross">x</p>
                </div>
                <hr />
              </div>
            );
          }
          return null;
        })}
        {Object.keys(cartItems).length === 0 && <p>Your cart is empty</p>}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Total</h2>
          <div>
            <div className="card-total-details">
              <p>Subtotal</p>
              <p>LKR {getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="card-total-details">
              <p>Delivery Fee</p>
              <p>LKR {getTotalCartAmount()===0?0:150}</p>
            </div>
            <hr />
            <div className="card-total-details">
              <b>Total</b>
              <b>LKR {getTotalCartAmount()===0?0:getTotalCartAmount()+150}</b>
            </div>
          </div>
          <button onClick={handleCheckout}>CHECKOUT</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;