import React, { useState, useEffect } from 'react';
import { API } from 'aws-amplify';

const ChemicalInventory = () => {
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchChemicals();
  }, []);

  const fetchChemicals = async () => {
    try {
      setLoading(true);
      console.log('Fetching chemicals from S3...');
      const response = await API.get('chbe-inventory-api', '/inventory');
      console.log('API Response:', response);
      
      if (Array.isArray(response)) {
        setChemicals(response);
      } else if (response.body) {
        setChemicals(Array.isArray(response.body) ? response.body : []);
      } else {
        console.error('Unexpected API response structure:', response);
        setError('Received unexpected data format from server');
      }
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
      await fetchChemicals();
      setError(null);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity');
    }
  };

  const getHazardClass = (level) => {
    const level_num = parseInt(level);
    if (level_num >= 4) return 'bg-red-100 text-red-800';
    if (level_num === 3) return 'bg-orange-100 text-orange-800';
    if (level_num === 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const filteredChemicals = chemicals.filter(chemical =>
    chemical.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chemical.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chemical.formula?.toLowerCase().includes(searchTerm.toLowerCase())
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
      <h1 className="text-2xl font-bold mb-6">Chemical Inventory Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, formula, or location..."
          value={searchTterm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-lg shadow-sm"
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Hazard Level</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Min. Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChemicals.map((chemical) => (
              <tr key={chemical.chemical_id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3">
                  {chemical.sds_url ? (
                    <a 
                      href={chemical.sds_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {chemical.name}
                    </a>
                  ) : (
                    chemical.name
                  )}
                </td>
                <td className="px-4 py-3 font-mono">{chemical.formula}</td>
                <td className="px-4 py-3">{chemical.location}</td>
                <td className="px-4 py-3">
                  <span className={Number(chemical.current_quantity) < Number(chemical.minimum_quantity) ? 'text-red-600 font-medium' : ''}>
                    {chemical.current_quantity}
                  </span>
                </td>
                <td className="px-4 py-3">{chemical.unit}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHazardClass(chemical.hazard_level)}`}>
                    Level {chemical.hazard_level}
                  </span>
                </td>
                <td className="px-4 py-3">{chemical.minimum_quantity}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateQuantity(chemical.chemical_id, Number(chemical.current_quantity) - 1)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => updateQuantity(chemical.chemical_id, Number(chemical.current_quantity) + 1)}
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
