// src/components/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { API } from 'aws-amplify';
import AddChemicalModal from './modals/AddChemicalModal';
import RestockModal from './modals/RestockModal';
console.log('API object:', API);
const AdminPage = () => {
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

  useEffect(() => {
    console.log('AdminPage mounted, fetching chemicals...');
    fetchChemicals();
  }, []);

  const fetchChemicals = async () => {
  try {
    setLoading(true);
    const response = await API.get('chbe-inventory-api', '/inventory');
    
    if (response.body) {
      const parsedBody = typeof response.body === 'string' 
        ? JSON.parse(response.body) 
        : response.body;
      
      if (parsedBody.data) {
        const cleanData = parsedBody.data.replace(/\\r\\n/g, '\n');
        const rows = cleanData.split('\n');
        const headers = rows[0].split(',');
        
        const data = rows.slice(1)
          .filter(row => row.trim())
          .map(row => {
            const values = row.split(',');
            const rowObject = {};
            headers.forEach((header, index) => {
              const cleanHeader = header.trim().replace(/\\r/g, '');
              rowObject[cleanHeader] = values[index]?.trim() || '';
            });
            return rowObject;
          });
        
        setChemicals(data);
      }
    }
  } catch (err) {
    console.error('Error fetching chemicals:', err);
    setError('Failed to load chemical inventory');
  } finally {
    setLoading(false);
  }
};

  const handleAddChemical = async (newChemical) => {
    try {
      console.log('Adding new chemical:', newChemical);
      const response = await API.post('chbe-inventory-api', '/inventory', {
        body: newChemical
      });
      console.log('Add chemical response:', response);
      setIsAddModalOpen(false);
      await fetchChemicals();
    } catch (err) {
      console.error('Error adding chemical:', err);
      setError(`Failed to add new chemical: ${err.message}`);
    }
  };

  const handleRestock = async (chemicalId, amount) => {
    try {
      const chemical = chemicals.find((c) => c.chemical_id === chemicalId);
      if (!chemical) {
        throw new Error('Chemical not found');
      }
      const newQuantity = Number(chemical.current_quantity) + Number(amount);
      await API.put('chbe-inventory-api', `/inventory/${chemicalId}`, {
        body: { quantity: newQuantity }
      });
      setIsRestockModalOpen(false);
      await fetchChemicals();
    } catch (err) {
      console.error('Error restocking chemical:', err);
      setError(`Failed to restock chemical: ${err.message}`);
    }
  };

  const handleRemoveChemical = async (chemicalId) => {
    if (window.confirm('Are you sure you want to remove this chemical?')) {
      try {
        await API.del('chbe-inventory-api', `/inventory/${chemicalId}`);
        await fetchChemicals();
      } catch (err) {
        console.error('Error removing chemical:', err);
        setError(`Failed to remove chemical: ${err.message}`);
      }
    }
  };

  // Filter chemicals based on search term with safety checks
  const filteredChemicals = chemicals.filter(chemical => 
    (chemical?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false) ||
    (chemical?.location?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false)
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Current Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Min. Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Unit</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChemicals.length > 0 ? (
              filteredChemicals.map((chemical) => (
                <tr key={chemical.chemical_id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">{chemical.name}</td>
                  <td className="px-4 py-3 font-mono">{chemical.formula}</td>
                  <td className="px-4 py-3">{chemical.location}</td>
                  <td className="px-4 py-3">
                    <span className={Number(chemical.current_quantity) < Number(chemical.minimum_quantity) ? 'text-red-600 font-medium' : ''}>
                      {chemical.current_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">{chemical.minimum_quantity}</td>
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
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'No chemicals found matching your search.' : 'No chemicals in the inventory yet.'}
                </td>
              </tr>
            )}
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
