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
        // Step 1: Get CID
        const cidResponse = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(chemical.name)}/cids/JSON`
        );
        const cidData = await cidResponse.json();
        
        if (!cidData.IdentifierList?.CID?.[0]) {
          throw new Error('Chemical not found in PubChem');
        }

        const cid = cidData.IdentifierList.CID[0];
        console.log('Found CID:', cid);

        // Step 2: Get GHS Data
        const ghsResponse = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON/?heading=GHS%20Classification`
        );
        const ghsData = await ghsResponse.json();

        // Extract hazard information
        const processHazards = (data) => {
          const hazards = {
            statements: [],
            signalWord: null
          };

          try {
            // Find GHS Classification section
            const ghsSection = data.Record.Section.find(
              section => section.TOCHeading === "GHS Classification"
            );

            if (ghsSection?.Information) {
              ghsSection.Information.forEach(info => {
                info.Value?.StringWithMarkup?.forEach(item => {
                  const text = item.String;
                  if (text.startsWith('Signal Word:')) {
                    hazards.signalWord = text.replace('Signal Word:', '').trim();
                  } else if (text.includes('H')) {
                    hazards.statements.push(text);
                  }
                });
              });
            }
          } catch (e) {
            console.error('Error processing hazard data:', e);
          }

          return hazards;
        };

        const hazards = processHazards(ghsData);
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
            {error}
          </div>
        )}

        {hazardInfo && !loading && (
          <div className="space-y-4">
            {hazardInfo.signalWord && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Signal Word: <span className="font-medium">{hazardInfo.signalWord}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hazardInfo.statements.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Hazard Statements</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {hazardInfo.statements.map((statement, index) => (
                    <li key={index} className="text-sm">{statement}</li>
                  ))}
                </ul>
              </div>
            )}

            {(!hazardInfo.statements.length && !hazardInfo.signalWord) && (
              <div className="text-gray-600 text-center">
                <p>No GHS hazard information available for this chemical.</p>
              </div>
            )}
          </div>
        )}

        {!loading && !error && !hazardInfo && (
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
