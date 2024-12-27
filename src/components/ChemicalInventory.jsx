import React, { useState, useEffect } from 'react';
import { API } from 'aws-amplify';

const UsageModal = ({ chemical, isOpen, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const usageAmount = Number(amount);
    
    if (isNaN(usageAmount) || usageAmount <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    if (usageAmount > chemical.current_quantity) {
      setError(`Not enough ${chemical.name} available. Current quantity: ${chemical.current_quantity} ${chemical.unit}`);
      return;
    }

    onConfirm(usageAmount);
    setAmount('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Record Usage</h2>
        <p className="mb-4">How much {chemical.name} are you using today?</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder={`Enter amount (${chemical.unit})`}
              />
              <span className="text-gray-600">{chemical.unit}</span>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChemicalInventory = () => {
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChemical, setSelectedChemical] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
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
          
          const data = rows.slice(1).filter(row => row.trim()).map(row => {
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

  const updateQuantity = async (chemical, usageAmount) => {
    try {
      const newQuantity = Number(chemical.current_quantity) - usageAmount;
      await API.put('chbe-inventory-api', `/inventory/${chemical.chemical_id}`, {
        body: { 
          quantity: newQuantity,
          usage: {
            amount: usageAmount,
            timestamp: new Date().toISOString(),
            remaining: newQuantity
          }
        }
      });
      await fetchChemicals();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity');
    }
  };

  const handleUseClick = (chemical) => {
    setSelectedChemical(chemical);
    setIsModalOpen(true);
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
                <td className="px-4 py-3">{chemical.hazard_level}</td>
                <td className="px-4 py-3">{chemical.minimum_quantity}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleUseClick(chemical)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    Use
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedChemical && (
        <UsageModal
          chemical={selectedChemical}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedChemical(null);
          }}
          onConfirm={(amount) => updateQuantity(selectedChemical, amount)}
        />
      )}
    </div>
  );
};

export default ChemicalInventory;
