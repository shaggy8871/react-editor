import React from 'react';
import ReactDOM from 'react-dom/client';
import ParentComponent from './ParentComponent';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <ParentComponent />
  </React.StrictMode>
);