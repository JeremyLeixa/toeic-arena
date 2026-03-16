import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

import { supabase } from './supabase.js'

// Bridge window.storage → Supabase
// L'app existante appelle window.storage.get/set/delete
// On redirige vers Supabase transparently
window.supabaseClient = supabase;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)