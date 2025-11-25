// File: src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // <--- This import is CRITICAL for styles to load
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);