import React, { useState, useEffect } from 'react';
import { API } from 'aws-amplify';

const AdminPage = () => {
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newChemical, setNewChemical] = useState({
    name: '',
    formula: '',
    location: '',
    current_quantity: '',
    unit: '',
    hazard_level: '',
    minimum_quantity: '',
  });

  useEffect(() => {
    fetchChemicals();
  }, []);

  const fetchChemicals = async () => {
    try {
      setLoading(true);
      const response = await API.get('chbe-inventory-api', '/inventory');
      setChemicals(response.body ? JSON.parse(response.body).data : []);
    } catch (err) {
      console.error('Error fetching chemicals:', err);
      setError('Failed to load chemical inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async (chemicalId, amount) => {
    try {
      const chemical = chemicals.find((c) => c.chemical_id === chemicalId);
      const newQuantity = Number(chemical.current_quantity) + Number(amount);
      await API.put('chbe-inventory-api', `/inventory/${chemicalId}`, {
        body: { quantity: newQuantity },
      });
      fetchChemicals();
    } catch (err) {
      console.error('Error restocking chemical:', err);
      setError('Failed to restock chemical');
    }
  };

  const handleAddChemical = async () => {
    try {
      await API.post('chbe-inventory-api', '/inventory', {
        body: newChemical,
      });
      setNewChemical({
        name: '',
        formula: '',
        location: '',
        current_quantity: '',
        unit: '',
        hazard_level: '',
        minimum_quantity: '',
      });
      fetchChemicals();
    } catch (err) {
      console.error('Error adding chemical:', err);
      setError('Failed to add new chemical');
    }
  };

  const handleRemoveChemical = async (chemicalId) => {
    try {
      await API.del('chbe-inventory-api', `/inventory/${chemicalId}`);
      fetchChemicals();
    } catch (err) {
      console.error('Error removing chemical:', err);
      setError('Failed to remove chemical');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">Add New Chemical</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddChemical();
        }}
        className="space-y-4 mb-6"
      >
        {Object.keys(newChemical).map((field) => (
          <div key={field} className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">{field.replace('_', ' ')}</label>
            <input
              type="text"
              value={newChemical[field]}
              onChange={(e) => setNewChemical({ ...newChemical, [field]: e.target.value })}
              className="p-2 border rounded"
              required
            />
          </div>
        ))}
        <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Add Chemical
        </button>
      </form>

      <h2 className="text-xl font-bold mb-4">Manage Chemicals</h2>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {chemicals.map((chemical) => (
              <tr key={chemical.chemical_id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3">{chemical.name}</td>
                <td className="px-4 py-3">{chemical.current_quantity}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => {
                      const amount = prompt('Enter restock amount:');
                      if (amount) handleRestock(chemical.chemical_id, amount);
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
    </div>
  );
};

export default AdminPage;
