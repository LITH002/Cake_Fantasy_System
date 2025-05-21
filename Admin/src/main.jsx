import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from "react-router-dom"
import './Components/LoadingStates/LoadingStates.css'

// Import login helper for debugging
// This allows calling window.testLogin() or window.clearAuth() from console
import './utils/loginHelper.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter> 
)