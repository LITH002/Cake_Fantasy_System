// import React from 'react'
import './ExploreCategories.css'
import PropTypes from 'prop-types';
import {category_list} from '../../assets/assets'

const ExploreCategories = ({category, setCategory}) => {
  return (
    <div className='explore-categories' id='explore-categories'>
      <h1>Find Your Item Here</h1>
      <p className='explore-categories-text'>Filter your item by category</p>
      <div className='explore-category-list'>
        {category_list.map((item, index) => {
          return (
            <div onClick={()=>setCategory(prev=>prev===item.category?"All":item.category)} key={index} className='explore-category-list-item'>
              <img className={category===item.category?"active":""} src={item.category_image} alt="" />
              <p>{item.category}</p>
            </div>
          )
})}
    </div>
    <hr></hr>
    </div>
  )
}
ExploreCategories.propTypes = {
  category: PropTypes.string.isRequired,
  setCategory: PropTypes.func.isRequired,
};

export default ExploreCategories