import React from 'react'
import ReactDOM from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css'
import App from './App'

// Add error handling for React rendering
const rootElement = document.getElementById('root');

// Debug check
console.log("Root element found:", rootElement);

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  console.log("React app mounted successfully");
} catch (error) {
  console.error("Error rendering React app:", error);
  // Display error on page
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="color: red; margin: 20px;">
        <h1>React Rendering Error</h1>
        <p>${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `;
  }
}

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <BrowserRouter>
//       <ChakraProvider>
//         <App />
//       </ChakraProvider>
//     </BrowserRouter>
//   </React.StrictMode>, 
// )
