//import React from 'react'
import './Header.css'
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
   const handleViewItems = () => {
    navigate('/viewitems');
    window.scrollTo(0, 0);
  };

  return (
    <div>
      <div className='header'>
          <div className="header-contents">
              <h1>You Name It... We Have It!</h1> 
              <p>Find whatever the cake item you need, to bake your own cake</p>
              <button onClick={handleViewItems} className='view-btn'>View Items</button>
              
          </div>
      </div>

    </div>
  )
}

export default Header