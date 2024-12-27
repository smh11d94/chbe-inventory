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
        
        if (!cidResponse.ok) {
          throw new Error('Failed to fetch chemical information');
        }
        
        const cidData = await cidResponse.json();
        
        if (!cidData.IdentifierList?.CID?.[0]) {
          throw new Error('Chemical not found in PubChem');
        }

        const cid = cidData.IdentifierList.CID[0];

        // Then get the hazard information
        const hazardResponse = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`
        );
        
        if (!hazardResponse.ok) {
          throw new Error('Failed to fetch hazard information');
        }
        
        const hazardData = await hazardResponse.json();
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
      pictograms: [],
      warnings: []
    };

    try {
      // Navigate through the sections to find GHS Classification
      const sections = data.Record.Section.find(
        section => section.TOCHeading === 'Safety and Hazards'
      )?.Section || [];

      const ghsSection = sections.find(
        section => section.TOCHeading === 'GHS Classification'
      );

      if (ghsSection?.Section) {
        // Find pictograms
        const pictogramSection = ghsSection.Section.find(
          section => section.TOCHeading === 'Pictogram(s)'
        );

        if (pictogramSection?.Information?.[0]?.Value?.StringWithMarkup) {
          pictogramSection.Information[0].Value.StringWithMarkup.forEach(item => {
            if (item.Markup?.[0]?.URL) {
              hazards.pictograms.push(item.Markup[0].URL);
            }
          });
        }

        // Find hazard statements
        const hazardSection = ghsSection.Section.find(
          section => section.TOCHeading === 'GHS Hazard Statements'
        );

        if (hazardSection?.Information?.[0]?.Value?.StringWithMarkup) {
          hazardSection.Information[0].Value.StringWithMarkup.forEach(item => {
            if (item.String) {
              hazards.warnings.push(item.String);
            }
          });
        }
      }
    } catch (e) {
      console.error('Error processing hazard data:', e);
    }

    return hazards;
  };

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
            {hazardInfo.pictograms.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">GHS Pictograms</h3>
                <div className="flex flex-wrap gap-4">
                  {hazardInfo.pictograms.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt="GHS pictogram"
                      className="w-24 h-24 object-contain"
                      onError={(e) => {
                        console.error('Failed to load image:', url);
                        e.target.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

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

            {hazardInfo.pictograms.length === 0 && hazardInfo.warnings.length === 0 && (
              <div className="text-gray-600">
                No hazard information available for this chemical in PubChem database.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChemicalHazardModal;
