import React, { useState, useEffect } from 'react';

// Map of hazard phrases to GHS pictograms
const HAZARD_TO_GHS = {
  // Explosive hazards -> GHS01
  'explosive': 'GHS01',
  'explosiv': 'GHS01',
  'unstable explosive': 'GHS01',
  
  // Flammable hazards -> GHS02
  'flammable': 'GHS02',
  'pyrophoric': 'GHS02',
  'catches fire': 'GHS02',
  'heating may cause fire': 'GHS02',
  
  // Oxidizing hazards -> GHS03
  'oxidizing': 'GHS03',
  'oxidising': 'GHS03',
  'may cause fire or explosion': 'GHS03',
  'may intensify fire': 'GHS03',
  
  // Compressed gas -> GHS04
  'contains gas under pressure': 'GHS04',
  'compressed gas': 'GHS04',
  'liquefied gas': 'GHS04',
  'dissolved gas': 'GHS04',
  
  // Corrosive -> GHS05
  'corrosive': 'GHS05',
  'causes severe skin burns': 'GHS05',
  'causes serious eye damage': 'GHS05',
  
  // Toxic -> GHS06
  'fatal': 'GHS06',
  'toxic': 'GHS06',
  
  // Harmful/Irritant -> GHS07
  'harmful': 'GHS07',
  'irritant': 'GHS07',
  'irritating': 'GHS07',
  'may cause respiratory irritation': 'GHS07',
  'may cause drowsiness': 'GHS07',
  'may cause allergic skin reaction': 'GHS07',
  
  // Health hazard -> GHS08
  'carcinogen': 'GHS08',
  'mutagen': 'GHS08',
  'reproductive toxicity': 'GHS08',
  'respiratory sensitizer': 'GHS08',
  'target organ toxicity': 'GHS08',
  'aspiration hazard': 'GHS08',
  
  // Environmental hazard -> GHS09
  'aquatic': 'GHS09',
  'environmental': 'GHS09',
  'hazardous to the aquatic': 'GHS09'
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
        // First get the CID
        const cidResponse = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(chemical.name)}/cids/JSON`
        );
        const cidData = await cidResponse.json();
        
        if (!cidData.IdentifierList?.CID?.[0]) {
          throw new Error('Chemical not found in PubChem');
        }

        const cid = cidData.IdentifierList.CID[0];

        // Get hazard information
        const hazardResponse = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`
        );
        const hazardData = await hazardResponse.json();

        // Process the hazard data
        const hazards = processHazardData(hazardData);
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

  const processHazardData = (data) => {
    const hazards = {
      pictograms: new Set(),
      warnings: new Set()
    };

    try {
      // Function to check text against hazard mappings
      const findMatchingPictograms = (text) => {
        const lowerText = text.toLowerCase();
        for (const [hazardPhrase, ghsCode] of Object.entries(HAZARD_TO_GHS)) {
          if (lowerText.includes(hazardPhrase)) {
            hazards.pictograms.add(ghsCode);
          }
        }
      };

      // Navigate through sections to find hazard statements
      const sections = data.Record.Section;
      sections.forEach(section => {
        if (section.TOCHeading.includes('GHS')) {
          section.Section?.forEach(subSection => {
            if (subSection.TOCHeading.includes('Hazard')) {
              subSection.Information?.forEach(info => {
                info.Value?.StringWithMarkup?.forEach(item => {
                  if (item.String) {
                    hazards.warnings.add(item.String);
                    // Check the hazard statement for matching pictograms
                    findMatchingPictograms(item.String);
                  }
                });
              });
            }
          });
        }
      });
    } catch (e) {
      console.error('Error processing hazard data:', e);
    }

    return {
      pictograms: Array.from(hazards.pictograms),
      warnings: Array.from(hazards.warnings)
    };
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
          <div className="space-y-6">
            {hazardInfo.pictograms.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">GHS Pictograms</h3>
                <div className="flex flex-wrap gap-4">
                  {hazardInfo.pictograms.map((ghsNumber) => (
                    <div key={ghsNumber} className="border rounded p-2 bg-white">
                      <img
                        src={`/ghs-pictograms/${ghsNumber}.svg`}
                        alt={`GHS pictogram ${ghsNumber}`}
                        className="w-24 h-24 object-contain"
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
        )}

        {!loading && !error && (!hazardInfo || (!hazardInfo.pictograms?.length && !hazardInfo.warnings?.length)) && (
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
