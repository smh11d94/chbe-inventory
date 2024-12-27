// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ChemicalInventory from './components/ChemicalInventory';
import AdminPage from './components/AdminPage';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div>
          <nav className="bg-gray-800 p-4">
            <div className="max-w-7xl mx-auto flex justify-between">
              <div className="flex space-x-4">
                <Link to="/" className="text-white hover:text-gray-300">
                  Inventory
                </Link>
                <Link to="/admin" className="text-white hover:text-gray-300">
                  Admin
                </Link>
              </div>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<ChemicalInventory />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
