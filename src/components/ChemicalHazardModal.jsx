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
        // Get CID first
        const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(chemical.name)}/property/IUPACName/JSON`;
        const cidResponse = await fetch(cidUrl);
        const cidData = await cidResponse.json();
        
        if (!cidData?.PropertyTable?.Properties?.[0]?.CID) {
          throw new Error('Chemical not found in PubChem');
        }

        const cid = cidData.PropertyTable.Properties[0].CID;

        // Get GHS data using PUG View
        const ghs_url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`;
        const ghsResponse = await fetch(ghs_url);
        const ghsData = await ghsResponse.json();

        // Process hazard data
        const hazards = {
          pictograms: [],
          warnings: [],
          hazardClasses: []
        };

        // Navigate through sections
        if (ghsData?.Record?.Section) {
          ghsData.Record.Section.forEach(section => {
            if (section.TOCHeading.includes('GHS')) {
              section.Section?.forEach(subSection => {
                // Get pictograms
                if (subSection.TOCHeading.includes('Pictogram')) {
                  subSection.Information?.forEach(info => {
                    info.Value?.StringWithMarkup?.forEach(item => {
                      item.Markup?.forEach(markup => {
                        if (markup.URL) {
                          hazards.pictograms.push(markup.URL);
                        }
                      });
                    });
                  });
                }
                
                // Get hazard statements
                if (subSection.TOCHeading.includes('Hazard')) {
                  subSection.Information?.forEach(info => {
                    info.Value?.StringWithMarkup?.forEach(item => {
                      if (item.String && !hazards.warnings.includes(item.String)) {
                        hazards.warnings.push(item.String);
                      }
                    });
                  });
                }
              });
            }
          });
        }

        setHazardInfo(hazards);
      } catch (err) {
        console.error('Error fetching hazard info:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHazardInfo();
  }, [isOpen, chemical]);

  if (!isOpen) return null;

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

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )}

        {hazardInfo && !loading && (
          <div className="space-y-6">
            {hazardInfo.pictograms.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">GHS Pictograms</h3>
                <div className="flex flex-wrap gap-4">
                  {hazardInfo.pictograms.map((url, index) => (
                    <div key={index} className="border rounded p-2">
                      <img
                        src={url}
                        alt="GHS pictogram"
                        className="w-24 h-24 object-contain"
                        onError={(e) => {
                          console.error('Failed to load image:', url);
                          e.target.parentElement.style.display = 'none';
                        }}
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

            {(!hazardInfo.pictograms.length && !hazardInfo.warnings.length) && (
              <div className="text-gray-600 text-center py-4">
                <p>Loading hazard information from PubChem...</p>
                <p className="text-sm mt-2">Note: Some chemicals may not have GHS classification data available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChemicalHazardModal;
