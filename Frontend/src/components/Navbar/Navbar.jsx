import React, { useContext, useState } from 'react'
import './Navbar.css'
import assets from '../../assets/assets'
import { Link } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'

const Navbar = ({setShowLogin}) => {

  const [menu, setMenu] = useState("menu");
  
  const {getTotalCartAmount} = useContext(StoreContext);

  return (
    <div className='navbar'>
      <Link to='/'><img src={assets.font} alt="" className="text" /></Link>
      <ul className="navbar-menu">
        <Link to='/' onClick={()=>setMenu("Home")} className={menu==="Home"?"active":""}>Home</Link >
        <a href='#explore-categories' onClick={()=>setMenu("Items")} className={menu==="Items"?"active":""}>Items</a>
        <a href='#footer' onClick={()=>setMenu("Contact Us")} className={menu==="Contact Us"?"active":""}>Contact Us</a>
      </ul>
      <div className="navbar-right">
        <img src={assets.search_icon} alt="" />
        <div className='navbar-search-icon'>
        <Link to='/cart'><img src={assets.cart} className='cart-icon' alt="" /></Link>
          <div className={getTotalCartAmount()===0?"0":"dot"}></div>
        </div>
        <button onClick={() => setShowLogin(true)}>Place Order</button>
      </div>
    </div>
  )
}

export default Navbar