// src/components/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { API } from 'aws-amplify';
import AddChemicalModal from './modals/AddChemicalModal';
import RestockModal from './modals/RestockModal';

const AdminPage = () => {
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

  useEffect(() => {
    fetchChemicals();
  }, []);

  const fetchChemicals = async () => {
    try {
      setLoading(true);
      const response = await API.get('chbe-inventory-api', '/inventory');
      
      // Ensure we're dealing with proper JSON data
      let data;
      if (typeof response.body === 'string') {
        data = JSON.parse(response.body);
      } else {
        data = response.body;
      }

      // Ensure we have an array of chemicals
      const chemicalsArray = Array.isArray(data) ? data : 
                           Array.isArray(data.data) ? data.data : [];
      
      setChemicals(chemicalsArray);
    } catch (err) {
      console.error('Error fetching chemicals:', err);
      setError('Failed to load chemical inventory');
      setChemicals([]); // Ensure chemicals is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async (chemicalId, amount) => {
    try {
      const chemical = chemicals.find((c) => c.chemical_id === chemicalId);
      const newQuantity = Number(chemical.current_quantity) + Number(amount);
      await API.put('chbe-inventory-api', `/inventory/${chemicalId}`, {
        body: { quantity: newQuantity }
      });
      setIsRestockModalOpen(false);
      await fetchChemicals();
    } catch (err) {
      console.error('Error restocking chemical:', err);
      setError('Failed to restock chemical');
    }
  };

  const handleAddChemical = async (newChemical) => {
    try {
      await API.post('chbe-inventory-api', '/inventory', {
        body: newChemical
      });
      setIsAddModalOpen(false);
      await fetchChemicals();
    } catch (err) {
      console.error('Error adding chemical:', err);
      setError('Failed to add new chemical');
    }
  };

  const handleRemoveChemical = async (chemicalId) => {
    if (window.confirm('Are you sure you want to remove this chemical?')) {
      try {
        await API.del('chbe-inventory-api', `/inventory/${chemicalId}`);
        await fetchChemicals();
      } catch (err) {
        console.error('Error removing chemical:', err);
        setError('Failed to remove chemical');
      }
    }
  };

  // Filter chemicals based on search term
  const filteredChemicals = chemicals.filter(chemical => 
    chemical.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chemical.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add New Chemical
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search chemicals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Formula</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Unit</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChemicals.map((chemical) => (
              <tr key={chemical.chemical_id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3">{chemical.name}</td>
                <td className="px-4 py-3 font-mono">{chemical.formula}</td>
                <td className="px-4 py-3">{chemical.location}</td>
                <td className="px-4 py-3">
                  <span className={Number(chemical.current_quantity) < Number(chemical.minimum_quantity) ? 'text-red-600 font-medium' : ''}>
                    {chemical.current_quantity}
                  </span>
                </td>
                <td className="px-4 py-3">{chemical.unit}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => {
                      setSelectedChemical(chemical);
                      setIsRestockModalOpen(true);
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Restock
                  </button>
                  <button
                    onClick={() => handleRemoveChemical(chemical.chemical_id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <AddChemicalModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddChemical}
        />
      )}

      {isRestockModalOpen && selectedChemical && (
        <RestockModal
          chemical={selectedChemical}
          isOpen={isRestockModalOpen}
          onClose={() => {
            setIsRestockModalOpen(false);
            setSelectedChemical(null);
          }}
          onRestock={handleRestock}
        />
      )}
    </div>
  );
};

export default AdminPage;
