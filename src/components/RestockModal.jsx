// src/components/RestockModal.jsx
import React, { useState } from 'react';

const RestockModal = ({ chemical, isOpen, onClose, onRestock }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAmount = Number(amount);
    
    if (isNaN(newAmount) || newAmount <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    onRestock(chemical.chemical_id, newAmount);
    setAmount('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Restock {chemical.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Quantity: {chemical.current_quantity} {chemical.unit}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter amount to add (${chemical.unit})`}
                required
              />
              <span className="text-gray-600">{chemical.unit}</span>
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestockModal;
