import { useContext, useState, useEffect, useRef } from 'react'
import './Navbar.css'
import assets from '../../assets/assets'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'

const Navbar = ({setShowLogin}) => {
  const [menu, setMenu] = useState("menu");
  const {getTotalCartAmount, token, setToken, item_list} = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  // Update active menu item based on current path
  useEffect(() => {
    if (location.pathname === '/') {
      setMenu('Home');
    } else if (location.pathname === '/viewitems') {
      setMenu('ViewItems');
    }
  }, [location.pathname]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filteredItems = item_list.filter(item => 
      item.name.toLowerCase().includes(term) || 
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.category && item.category.toLowerCase().includes(term))
    ).slice(0, 5); // Limit to 5 results
    
    setSearchResults(filteredItems);
  }, [searchTerm, item_list]);

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common['Authorization'];
    setToken("");
    navigate("/");
  }

  const handleSearchIconClick = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setTimeout(() => {
        const inputEl = document.getElementById('navbar-search-input');
        if (inputEl) inputEl.focus();
      }, 100);
    }
  };

  const handleSearchResultClick = (itemId) => {
    setShowSearch(false);
    setSearchTerm('');
    navigate(`/product/${itemId}`);
    window.scrollTo(0, 0);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim() !== '') {
      setShowSearch(false);
      navigate(`/viewitems?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
    }
  };

  // Scroll to footer for Contact Us
  const scrollToFooter = (e) => {
    e.preventDefault();
    setMenu("Contact Us");
    
    // First try to find the footer by ID
    const footer = document.getElementById('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }

    // If we're not on the home page, navigate home first then scroll
    if (location.pathname !== '/') {
      navigate('/');
      // Need to wait for navigation to complete before scrolling
      setTimeout(() => {
        const footer = document.getElementById('footer');
        if (footer) {
          footer.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  }

  return (
    <div className='navbar'>
      <Link to='/'><img src={assets.font} alt="" className="text" /></Link>
      <ul className="navbar-menu">
        <Link to='/' onClick={()=>setMenu("Home")} className={menu==="Home"?"active":""}>Home</Link>
        <Link to='/viewitems' onClick={()=>setMenu("ViewItems")} className={menu==="ViewItems"?"active":""}>Items</Link>
        <a href="#footer" onClick={scrollToFooter} className={menu==="Contact Us"?"active":""}>Contact Us</a>
      </ul>
      <div className="navbar-right">
        <div className="navbar-search" ref={searchRef}>
          <img 
            src={assets.search_icon} 
            alt="Search" 
            className="search-icon"
            onClick={handleSearchIconClick}
          />
          {showSearch && (
            <div className="search-container">
              <form onSubmit={handleSearchSubmit}>
                <input
                  id="navbar-search-input"
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit">
                  <img src={assets.search_icon} alt="Search" />
                </button>
              </form>
              
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(item => (
                    <div 
                      key={item.id} 
                      className="search-result-item"
                      onClick={() => handleSearchResultClick(item.id)}
                    >
                      <img src={item.image} alt={item.name} />
                      <div className="search-result-info">
                        <p className="search-result-name">{item.name}</p>
                        <p className="search-result-category">{item.category}</p>
                      </div>
                    </div>
                  ))}
                  <div 
                    className="view-all-results"
                    onClick={() => {
                      setShowSearch(false);
                      navigate(`/viewitems?search=${encodeURIComponent(searchTerm)}`);
                      setSearchTerm('');
                    }}
                  >
                    View all results
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className='navbar-search-icon'>
          <Link to='/cart'><img src={assets.cart} className='cart-icon' alt="" /></Link>
          <div className={getTotalCartAmount()===0?"0":"dot"}></div>
        </div>
        
        {!token ? (
          <button onClick={() => setShowLogin(true)}>Sign In</button>
        ) : (
          <div className='navbar-profile'>
            <img className='profile-icon' src={assets.profile_icon} alt="" />
            <ul className='nav-profile-dropdown'>
              <li>
                <Link to='/myorders'>
                  <li><img src={assets.bag_icon} alt=""/><p>Orders</p></li>
                </Link>
              </li>
              <hr />
              <li onClick={logout}><img src={assets.logout_icon} alt=""/><p>Logout</p></li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar