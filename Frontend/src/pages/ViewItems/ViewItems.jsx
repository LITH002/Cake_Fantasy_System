import {useState} from 'react'
import './ViewItems.css'
import ExploreCategories from '../../components/ExploreCategories/ExploreCategories'
import ItemDisplay from '../../components/ItemDisplay/ItemDisplay'

const ViewItems = () => {
  const[category,setCategory]=useState("All");
  return (
    <div>
        <ExploreCategories category={category} setCategory={setCategory}/> 
        <ItemDisplay category={category}/>
    </div>
  )
}

export default ViewItems