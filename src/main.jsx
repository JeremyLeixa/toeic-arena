import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Polyfill window.storage pour le mode local (simule le storage Claude)
if (!window.storage) {
  const store = {};
  window.storage = {
    get: async (key) => {
      const val = localStorage.getItem('ta_' + key);
      if (val === null) throw new Error('not found');
      return { key, value: val };
    },
    set: async (key, value) => {
      localStorage.setItem('ta_' + key, value);
      return { key, value };
    },
    delete: async (key) => {
      localStorage.removeItem('ta_' + key);
      return { key, deleted: true };
    },
    list: async (prefix) => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('ta_' + (prefix || ''))) keys.push(k.replace('ta_', ''));
      }
      return { keys };
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)