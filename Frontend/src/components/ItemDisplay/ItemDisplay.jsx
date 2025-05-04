import React, { useContext } from 'react'
import './ItemDisplay.css'
import { StoreContext } from '../../context/StoreContext'
import Items from '../Items/Items'

const ItemDisplay = ({category}) => {
    const {item_list} = useContext(StoreContext)
  return (
    <div className='item-display' id='item-display'>
        <h2>Items Available</h2>
        <div className="item-display-list">
          {item_list.map((item,index)=>{
            if (category==="All" || category===item.category) {
              return <Items key={index} id={item._id} name={item.name} price={item.price} description={item.description} image={item.image}/>
            }
          })}
        </div>
    </div>
  )
}

export default ItemDisplay