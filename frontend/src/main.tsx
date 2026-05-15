import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

import './styles/styles.css' 
import './styles/global.css' 
// import './styles/index.css'
// import './styles/App.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)