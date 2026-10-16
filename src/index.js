import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Dark-mode overrides for fixed light colors - loaded last so it sits on top of every other stylesheet.
import './styles/dark.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
