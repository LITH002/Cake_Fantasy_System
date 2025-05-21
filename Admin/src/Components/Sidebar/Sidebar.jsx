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
        {/* Dashboard - only for admin and owner */}
        {hasRole('admin') && (
          <NavLink to='/dashboard' className="sidebar-option">
            <img src={assets.dashboard_icon} alt=''/>
            <p>Dashboard</p>
          </NavLink>
        )}
        
        {/* Reports - only for admin and owner */}
        {hasRole('admin') && (
          <NavLink to='/reports' className="sidebar-option">
            <img src={assets.reports_icon} alt=''/>
            <p>Reports</p>
          </NavLink>
        )}
        
        {/* Add Items - now visible for all roles including employees */}
        <NavLink to='/add' className="sidebar-option">
          <img src={assets.add_icon} alt=''/>
          <p>Add Items</p>
        </NavLink>
        
        {/* List Items - for all roles */}
        <NavLink to='/list' className="sidebar-option">
          <img src={assets.order_icon} alt=''/>
          <p>Inventory</p>
        </NavLink>
        
        {/* Orders - for all roles */}
        <NavLink to='/orders' className="sidebar-option">
          <img src={assets.basket_icon} alt=''/>
          <p>Orders</p>
        </NavLink>
        
        {/* Suppliers - only for admin and owner */}
        {hasRole('admin') && (
          <NavLink to="/suppliers" className="sidebar-option">
            <img src={assets.supplier_icon} alt=''/>
            <p>Suppliers</p>
          </NavLink>
        )}
        
        {/* GRN - for all roles */}
        <NavLink to='/grn' className="sidebar-option">
          <img src={assets.grn_icon} alt=''/>
          <p>GRN</p>
        </NavLink>
        
        {/* User Management - only for admin and owner */}
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