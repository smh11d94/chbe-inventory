import React from 'react';
import { chemicalHazards, GHS_PICTOGRAMS, GHS_DESCRIPTIONS } from '../data/chemicalHazards';

const ChemicalHazardModal = ({ chemical, isOpen, onClose }) => {
  if (!isOpen) return null;

  // Get hazard info from local data
  const normalizedName = chemical.name.toLowerCase().trim();
  const hazardInfo = chemicalHazards[normalizedName];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">{chemical.name} - Hazard Information</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {hazardInfo ? (
          <div className="space-y-6">
            {hazardInfo.pictograms.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">GHS Pictograms</h3>
                <div className="flex flex-wrap gap-4">
                  {hazardInfo.pictograms.map((ghsNumber) => (
                    <div key={ghsNumber} className="border rounded p-2 bg-white">
                      <img
                        src={GHS_PICTOGRAMS[ghsNumber]}
                        alt={`GHS pictogram ${ghsNumber}`}
                        className="w-24 h-24 object-contain"
                        title={GHS_DESCRIPTIONS[ghsNumber]}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hazardInfo.warnings.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Hazard Statements</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {hazardInfo.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-600 text-center py-4">
            <p>No hazard information available for this chemical.</p>
            <p className="text-sm mt-2">Please consult the Safety Data Sheet (SDS) for safety information.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChemicalHazardModal;
