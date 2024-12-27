import React, { useState, useEffect } from 'react';

// Map PubChem pictogram URLs to local file names
const GHS_PICTOGRAMS = {
  'GHS01': '/ghs-pictograms/GHS01.svg', // Explosive
  'GHS02': '/ghs-pictograms/GHS02.svg', // Flammable
  'GHS03': '/ghs-pictograms/GHS03.svg', // Oxidizing
  'GHS04': '/ghs-pictograms/GHS04.svg', // Gas under pressure
  'GHS05': '/ghs-pictograms/GHS05.svg', // Corrosive
  'GHS06': '/ghs-pictograms/GHS06.svg', // Toxic
  'GHS07': '/ghs-pictograms/GHS07.svg', // Harmful/Irritant
  'GHS08': '/ghs-pictograms/GHS08.svg', // Health hazard
  'GHS09': '/ghs-pictograms/GHS09.svg'  // Environmental hazard
};

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

        // Get GHS data
        const ghs_url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`;
        const ghsResponse = await fetch(ghs_url);
        const ghsData = await ghsResponse.json();

        // Process hazard data
        const hazards = {
          pictograms: new Set(), // Using Set to avoid duplicates
          warnings: new Set()    // Using Set to avoid duplicates
        };

        // Function to extract GHS number from PubChem URL
        const extractGHSNumber = (url) => {
          const match = url.match(/GHS(\d+)\.svg/);
          return match ? `GHS${match[1].padStart(2, '0')}` : null;
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
                          const ghsNumber = extractGHSNumber(markup.URL);
                          if (ghsNumber && GHS_PICTOGRAMS[ghsNumber]) {
                            hazards.pictograms.add(ghsNumber);
                          }
                        }
                      });
                    });
                  });
                }
                
                // Get hazard statements
                if (subSection.TOCHeading.includes('Hazard')) {
                  subSection.Information?.forEach(info => {
                    info.Value?.StringWithMarkup?.forEach(item => {
                      if (item.String) {
                        hazards.warnings.add(item.String);
                      }
                    });
                  });
                }
              });
            }
          });
        }

        setHazardInfo({
          pictograms: Array.from(hazards.pictograms),
          warnings: Array.from(hazards.warnings)
        });
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
                  {hazardInfo.pictograms.map((ghsNumber) => (
                    <div key={ghsNumber} className="border rounded p-2 bg-white">
                      <img
                        src={GHS_PICTOGRAMS[ghsNumber]}
                        alt={`GHS pictogram ${ghsNumber}`}
                        className="w-24 h-24 object-contain"
                        title={getGHSDescription(ghsNumber)}
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
                <p>No hazard information available for this chemical.</p>
                <p className="text-sm mt-2">Please consult the Safety Data Sheet (SDS) for safety information.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get descriptions for pictograms
const getGHSDescription = (ghsNumber) => {
  const descriptions = {
    'GHS01': 'Explosive',
    'GHS02': 'Flammable',
    'GHS03': 'Oxidizing',
    'GHS04': 'Gas Under Pressure',
    'GHS05': 'Corrosive',
    'GHS06': 'Acute Toxicity',
    'GHS07': 'Harmful/Irritant',
    'GHS08': 'Health Hazard',
    'GHS09': 'Environmental Hazard'
  };
  return descriptions[ghsNumber] || ghsNumber;
};

export default ChemicalHazardModal;
