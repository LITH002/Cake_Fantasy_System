import React, { useContext } from 'react'
import './Sidebar.css'
import assets from '../../assets/assets'
import { NavLink } from 'react-router-dom'
import { AdminAuthContext } from '../../context/AdminAuthContext'

const Sidebar = () => {
  const { hasRole } = useContext(AdminAuthContext);

  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        <NavLink to='/dashboard' className="sidebar-option">
          <img src={assets.dashboard_icon} alt=''/>
          <p>Dashboard</p>
        </NavLink>
        <NavLink to='/reports' className="sidebar-option">
          <img src={assets.reports_icon} alt=''/>
          <p>Reports</p>
        </NavLink>
        <NavLink to='/add' className="sidebar-option">
          <img src={assets.add_icon} alt=''/>
          <p>Add Items</p>
        </NavLink>
        <NavLink to='/list' className="sidebar-option">
          <img src={assets.order_icon} alt=''/>
          <p>List Items</p>
        </NavLink>
        <NavLink to='/orders' className="sidebar-option">
          <img src={assets.basket_icon} alt=''/>
          <p>Orders</p>
        </NavLink>
        <NavLink to="/suppliers" className="sidebar-option">
          <img src={assets.supplier_icon} alt=''/>
          <p>Suppliers</p>
        </NavLink>
        <NavLink to='/grn' className="sidebar-option">
          <img src={assets.grn_icon} alt=''/>
          <p>GRN</p>
        </NavLink>
        
        {/* Only show User Management for admin and owner roles */}
        {hasRole('admin') && (
          <NavLink to='/employee-management' className="sidebar-option">
            <img src={assets.user_icon || assets.add_icon} alt=''/>
            <p>User Management</p>
          </NavLink>
        )}
      </div>
    </div>
  )
}

export default Sidebar