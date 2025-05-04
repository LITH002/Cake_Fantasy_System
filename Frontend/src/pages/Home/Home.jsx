import {useState} from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import ExploreCategories from '../../components/ExploreCategories/ExploreCategories'
import ItemDisplay from '../../components/ItemDisplay/ItemDisplay'

const Home = () => {
  const[category,setCategory]=useState("All");
  return (
    <div>
        <Header/>
        <ExploreCategories category={category} setCategory={setCategory}/>
        <ItemDisplay category={category}/>
    </div>
  )
}

export default Home