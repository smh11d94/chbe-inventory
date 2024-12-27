import React, { useState, useEffect } from 'react';
import { API } from 'aws-amplify';

const ChemicalInventory = () => {
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
// Temporary mock data for testing
const MOCK_DATA = [
  { id: '1', name: 'Test Chemical 1', quantity: 15, location: 'Lab A' },
  { id: '2', name: 'Test Chemical 2', quantity: 8, location: 'Lab B' },
];
  useEffect(() => {
    fetchChemicals();
  }, []);

  const fetchChemicals = async () => {
    try {
      setLoading(true);
      console.log('Fetching chemicals...');
      // Temporarily use mock data to verify rendering
      console.log('Using mock data for testing');
      setChemicals(MOCK_DATA);
      
      // Uncomment this when API is ready
      // const response = await API.get('chbe-inventory-api', '/inventory');
      // console.log('API Response:', response);
      // setChemicals(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching chemicals:', err);
      setError('Failed to load chemical inventory');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 0) {
      setError('Quantity cannot be negative');
      return;
    }

    try {
      await API.put('chbe-inventory-api', `/inventory/${id}`, {
        body: { quantity: newQuantity }
      });
      await fetchChemicals(); // Refresh the list
      setError(null);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity');
    }
  };

  const filteredChemicals = chemicals.filter(chemical =>
    chemical.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chemical.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Chemical Inventory Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search chemicals or locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-lg shadow-sm"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChemicals.map((chemical) => (
              <tr key={chemical.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3">{chemical.name}</td>
                <td className="px-4 py-3">
                  <span className={chemical.quantity < 10 ? 'text-red-600 font-medium' : ''}>
                    {chemical.quantity}
                  </span>
                </td>
                <td className="px-4 py-3">{chemical.location}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateQuantity(chemical.id, chemical.quantity - 1)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => updateQuantity(chemical.id, chemical.quantity + 1)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Add
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChemicalInventory;
