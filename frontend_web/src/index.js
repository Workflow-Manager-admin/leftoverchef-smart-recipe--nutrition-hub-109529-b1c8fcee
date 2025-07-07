import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// PATCH: Export or mirror ApiDebugContext to use here, fallback to App import
// Safely require ApiDebugContext from App.js, but to avoid circular import, define here if window is available
const ApiDebugContext =
  (window && window.ApiDebugContext) ||
  (typeof require !== "undefined"
    ? (() => {
        try {
          // eslint-disable-next-line
          return require('./App').ApiDebugContext || React.createContext();
        } catch {
          return React.createContext();
        }
      })()
    : React.createContext());

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Provide a context with no-op as fallback if missing */}
    <ApiDebugContext.Provider value={{}}>
      <App />
    </ApiDebugContext.Provider>
  </React.StrictMode>
);
