import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ChemicalInventory from './components/ChemicalInventory';
import AdminPage from './components/AdminPage';

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
