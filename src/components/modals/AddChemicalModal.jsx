// src/components/modals/AddChemicalModal.jsx
import React, { useState } from 'react';

const AddChemicalModal = ({ isOpen, onClose, onAdd }) => {
  const [newChemical, setNewChemical] = useState({
    name: '',
    formula: '',
    location: '',
    current_quantity: '',
    unit: '',
    hazard_level: '',
    minimum_quantity: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(newChemical);
    setNewChemical({
      name: '',
      formula: '',
      location: '',
      current_quantity: '',
      unit: '',
      hazard_level: '',
      minimum_quantity: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Add New Chemical</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newChemical.name}
                onChange={(e) => setNewChemical({ ...newChemical, name: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formula</label>
              <input
                type="text"
                value={newChemical.formula}
                onChange={(e) => setNewChemical({ ...newChemical, formula: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={newChemical.location}
                onChange={(e) => setNewChemical({ ...newChemical, location: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
              <input
                type="number"
                step="0.01"
                value={newChemical.current_quantity}
                onChange={(e) => setNewChemical({ ...newChemical, current_quantity: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={newChemical.unit}
                onChange={(e) => setNewChemical({ ...newChemical, unit: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select unit</option>
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="L">Liters (L)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hazard Level</label>
              <select
                value={newChemical.hazard_level}
                onChange={(e) => setNewChemical({ ...newChemical, hazard_level: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select hazard level</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Quantity</label>
              <input
                type="number"
                step="0.01"
                value={newChemical.minimum_quantity}
                onChange={(e) => setNewChemical({ ...newChemical, minimum_quantity: e.target.value })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
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
              Add Chemical
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChemicalModal;
