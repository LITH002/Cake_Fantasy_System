//import React from 'react'
import './Items.css'
import assets from '../../assets/assets'
import { useContext } from 'react'
import { StoreContext } from '../../context/StoreContext'

const Items = ({id,name,price,description,image}) => {
  
  const {cartItems,addToCart,removeFromCart} = useContext(StoreContext);

  return (
    <div className='item'>
        <div className="item-image-container">
            <img className='item-image' src={image} alt=""/>
            {!cartItems[id]
                ?<img className='add' onClick={()=>addToCart(id)} src={assets.add_icon_white} alt=""/>
                :<div className='item-counter'>
                  <img onClick={()=>removeFromCart(id)} src={assets.remove_icon} alt=''/>
                  <p>{cartItems[id]}</p>
                  <img onClick={()=>addToCart(id)} src={assets.add_icon_green} alt=''/>
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