import React, { useContext } from 'react'
import "./Cart.css"
import { StoreContext } from "../../context/StoreContext"
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cartItems, item_list, removeFromCart, getTotalCartAmount } = useContext(StoreContext);

  const navigate = useNavigate();

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
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <img src={item.image} alt="" />
                  <p>{item.name}</p>
                  <p>LKR {item.price}</p>
                  <p>{cartItems[item._id]}</p>
                  <p>LKR {item.price * cartItems[item._id]}</p>
                  <p onClick={() => removeFromCart(item._id)} className="cross">x</p>
                </div>
                <hr />
              </div>
            );
          }
        }) || <p>Your cart is empty</p>}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Card Total</h2>
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
          <button onClick={() => navigate('/order')}>CHECKOUT</button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
