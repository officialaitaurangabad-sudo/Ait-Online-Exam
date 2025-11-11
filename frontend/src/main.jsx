import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import App from './App.jsx'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'

// Import development tools in development mode
if (import.meta.env.DEV) {
  import('./utils/devTools.js').then(({ default: devTools }) => {
    // Initialize development tools
    devTools.checkEnvironment()
    devTools.testAPIConnectivity()
  })
  
  // Import console debug helpers
  import('./utils/consoleDebug.js')
  
  // Import re-authentication helpers
  import('./utils/forceReLogin.js')
  
  // Import analytics debug helpers
  import('./utils/debugAnalytics.js')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  </React.StrictMode>,
)
