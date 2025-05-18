import React from 'react'
import './Sidebar.css'
import assets from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        <NavLink to='/add' className="sidebar-option">
          <img src={assets.add_icon} alt=''/>
          <p>Add Items</p>
        </NavLink>
        <NavLink to='/list' className="sidebar-option">
          <img src={assets.order_icon} alt=''/>
          <p>List Items</p>
        </NavLink>
        <NavLink to='/orders' className="sidebar-option">
          <img src={assets.order_icon} alt=''/>
          <p>Orders</p>
        </NavLink>
        <NavLink to="/suppliers" className="sidebar-option">
          <img src={assets.supplier_icon} alt=''/>
          <p>Suppliers</p>
        </NavLink>
        <NavLink to='/grn' className="sidebar-option">
          <img src={assets.order_icon} alt=''/>
          <p>GRN</p>
        </NavLink>
        <NavLink to='/create-grn' className="sidebar-option">
          <img src={assets.add_icon} alt=''/>
          <p>Create GRN</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar