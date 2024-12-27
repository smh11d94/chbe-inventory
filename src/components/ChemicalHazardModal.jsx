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

        // Step 2: Get GHS Classification XML
        const ghsResponse = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/XML/?heading=GHS%20Classification`
        );
        const xmlText = await ghsResponse.text();
        
        // Parse XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        // Find GHS Classification section
        const ghsSection = xmlDoc.querySelector('Section > TOCHeading:contains("GHS Classification")');
        if (ghsSection) {
          // Find all URLs that end in .svg
          const svgUrls = [];
          const markupElements = ghsSection.parentElement.querySelectorAll('URL');
          markupElements.forEach(element => {
            const url = element.textContent;
            if (url.endsWith('.svg')) {
              svgUrls.push(url);
            }
          });

          // Get hazard statements
          const statements = [];
          const stringElements = ghsSection.parentElement.querySelectorAll('String');
          stringElements.forEach(element => {
            const text = element.textContent;
            if (text.includes('H') && text.includes('-')) {
              statements.push(text);
            }
          });

          setHazardInfo({
            pictograms: svgUrls,
            warnings: statements
          });
        } else {
          throw new Error('No GHS Classification found');
        }

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
          <div className="space-y-6">
            {hazardInfo.pictograms.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">GHS Pictograms</h3>
                <div className="flex flex-wrap gap-4">
                  {hazardInfo.pictograms.map((url, index) => (
                    <div key={index} className="border rounded p-2 bg-white">
                      <img
                        src={url}
                        alt="GHS pictogram"
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
