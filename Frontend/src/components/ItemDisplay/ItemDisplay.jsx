import React, { useContext } from 'react'
import './ItemDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import Items from '../Items/Items'

const ItemDisplay = ({category, customItems}) => {
  const {item_list} = useContext(StoreContext);
  
  // Use customItems if provided, otherwise filter based on category
  const displayItems = customItems || (
    category === "All" 
      ? item_list
      : item_list.filter((item) => item.category === category)
  );

  return (
    <div className='item-display' id='item-display'>
      <h2>
        {customItems 
          ? `Search Results (${displayItems.length})` 
          : category === "All" 
            ? "Items Available" 
            : category
        }
      </h2>
      <div className="item-display-list">
        {displayItems.map((item, index) => {
          return (
            <Items 
              key={index} 
              id={item.id}
              name={item.name}
              price={item.selling_price || item.cost_price || 0}
              image={item.image}
              category={item.category}
              weight_value={item.weight_value}
              weight_unit={item.weight_unit}
              unit={item.unit}
              rating={item.rating || 0}
            />
          );
        })}
      </div>
    </div>
  )
}

export default ItemDisplay