import React from 'react';
import ReactDOM from 'react-dom/client';

// Après (correction) :
import App from './App.tsx';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
