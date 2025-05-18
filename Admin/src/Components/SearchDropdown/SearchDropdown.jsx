import React, { useState, useEffect, useRef } from 'react';
import './SearchDropdown.css';

const SearchDropdown = ({ allItems, onItemSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filter items based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems([]);
    } else {
      const filtered = allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, allItems]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleItemSelect = (item) => {
    onItemSelect(item);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleAddNewItem = () => {
    if (searchTerm.trim() !== '') {
      onItemSelect({
        id: 'new',
        name: searchTerm,
        category: 'Cake Ingredients',
        price: ''
      });
      setSearchTerm('');
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="item-search-dropdown" ref={dropdownRef}>
      <input 
        type="text"
        placeholder="Search for an item or type to add new..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setIsDropdownOpen(true)}
        className="item-search-input"
      />
      
      {isDropdownOpen && searchTerm.trim() !== '' && (
        <div className="dropdown-menu">
          {filteredItems.length > 0 ? (
            <>
              <div className="dropdown-items">
                {filteredItems.map(item => (
                  <div 
                    key={item.id} 
                    className="dropdown-item"
                    onClick={() => handleItemSelect(item)}
                  >
                    <div className="item-name">{item.name}</div>
                    <div className="item-details">
                      <span className="item-category">{item.category}</span>
                      <span className="item-price">LKR {parseFloat(item.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-results">
              <p>No items match "{searchTerm}"</p>
            </div>
          )}
          
          <div 
            className="add-new-option"
            onClick={handleAddNewItem}
          >
            <span className="plus-icon">+</span> Add "{searchTerm}" as new item
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;