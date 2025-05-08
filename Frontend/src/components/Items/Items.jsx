//import React from 'react'
import './Items.css'
import assets from '../../assets/assets'
import { useContext } from 'react'
import { StoreContext } from '../../context/StoreContext'

// eslint-disable-next-line react/prop-types
const Items = ({ id, itemID, name, price, description, image }) => {
  
  // Use itemID if provided, otherwise fall back to id
  const actualItemID = itemID || id;
  
  const {cartItems, addToCart, removeFromCart, url} = useContext(StoreContext);

  // Debug log to see what props we're receiving
  console.log("Items component props:", { id, itemID, actualItemID, name });
  
  return (
    <div className='item'>
        <div className="item-image-container">
            <img className='item-image' src={url + "/images/" + image} alt=""/>
            {!cartItems[actualItemID]
                ?<img className='add' onClick={() => {
                  if (actualItemID !== undefined && actualItemID !== null) {
                    addToCart(actualItemID);
                    console.log("Adding to cart:", { actualItemID, name, price });
                  } else {
                    console.error('Cannot add item to cart: ID is undefined or null');
                  }
                }} src={assets.add_icon_white} alt=""/>
                :<div className='item-counter'>
                  <img onClick={()=>removeFromCart(actualItemID)} src={assets.remove_icon} alt=''/>
                  <p>{cartItems[actualItemID]}</p>
                  <img onClick={()=>addToCart(actualItemID)} src={assets.add_icon_green} alt=''/>
                </div>
            }
        </div>
        <div className="item-info">
            <div className="item-name-rating">
                <p>{name}</p>
                <img src={assets.star_rate} alt=""/>
            </div>
            <p className="item-desc">{description}</p>
            <p className="item-price">LKR {price}</p>
        </div>    
    </div>
  )
}

export default Items