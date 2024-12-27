import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import config from './aws-exports';
import ChemicalInventory from './components/ChemicalInventory';
import AdminPage from './components/AdminPage'; // Import the new Admin Page
import ErrorBoundary from './components/ErrorBoundary';

Amplify.configure(config);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4">
            <h1 className="text-3xl font-bold text-gray-900">CHBE Inventory</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <ErrorBoundary>
              <Routes>
                {/* Route for the main inventory page */}
                <Route path="/" element={<ChemicalInventory />} />
                
                {/* Route for the admin page */}
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
