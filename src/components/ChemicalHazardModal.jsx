// src/components/ChemicalHazardModal.jsx
import React, { useState, useEffect } from 'react';

const ChemicalHazardModal = ({ chemical, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hazardInfo, setHazardInfo] = useState(null);

  useEffect(() => {
    const fetchHazardInfo = async () => {
      if (!isOpen || !chemical) return;
      
      setLoading(true);
      setError(null);
      try {
        // First, get the CID
        const cidResponse = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(chemical.name)}/cids/JSON`
        );
        const cidData = await cidResponse.json();
        
        if (!cidData.IdentifierList?.CID?.[0]) {
          throw new Error('Chemical not found in PubChem');
        }

        const cid = cidData.IdentifierList.CID[0];
        console.log('Found CID:', cid);

        // Then get the hazard information
        const hazardResponse = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON`
        );
        const hazardData = await hazardResponse.json();

        // Process the hazard data
        const processedHazards = processHazardData(hazardData);
        setHazardInfo(processedHazards);
      } catch (err) {
        console.error('Error fetching hazard info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHazardInfo();
  }, [isOpen, chemical]);

  const processHazardData = (data) => {
    const hazards = {
      ghs: [],
      warnings: [],
      pictograms: []
    };

    try {
      const sections = data.Record.Section;
      
      // Look for GHS Classification section and Safety and Hazards section
      sections.forEach(section => {
        if (section.TOCHeading === 'Safety and Hazards') {
          section.Section.forEach(subSection => {
            if (subSection.TOCHeading === 'GHS Classification') {
              // Extract GHS pictograms
              subSection.Section.forEach(ghsSection => {
                if (ghsSection.TOCHeading === 'Pictogram(s)') {
                  hazards.pictograms = ghsSection.Information?.[0]?.Value?.StringWithMarkup?.[0]?.Markup?.[0]?.URL || [];
                }
              });
            }
            if (subSection.TOCHeading === 'Hazard Statements') {
              hazards.warnings = subSection.Information?.[0]?.Value?.StringWithMarkup?.[0]?.String || [];
            }
          });
        }
      });
    } catch (e) {
      console.error('Error processing hazard data:', e);
    }

    return hazards;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
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

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {hazardInfo && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">GHS Pictograms</h3>
              <div className="flex flex-wrap gap-4">
                {hazardInfo.pictograms.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt="GHS pictogram"
                    className="w-24 h-24 object-contain"
                  />
                ))}
              </div>
            </div>

            {hazardInfo.warnings.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Hazard Statements</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {hazardInfo.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChemicalHazardModal;
