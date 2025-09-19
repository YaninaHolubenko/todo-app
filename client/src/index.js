// client/src/index.js
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

// Import the background photo from src/assets/img
import bg from './assets/img/pexels-karolina-grabowska-4207776.jpg'

// Expose it to CSS as --bg-image so body::before can use it
document.documentElement.style.setProperty('--bg-image', `url(${bg})`)

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
