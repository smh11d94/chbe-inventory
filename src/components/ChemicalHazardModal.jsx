import React, { useState, useEffect } from 'react';

const ChemicalHazardModal = ({ chemical, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [svgFiles, setSvgFiles] = useState([]);
  const [ghsUrl, setGhsUrl] = useState('');

  useEffect(() => {
    const fetchHazardInfo = async () => {
      if (!isOpen || !chemical) return;

      setLoading(true);
      setError(null);
      setSvgFiles([]);  // Reset the SVG files list
      setGhsUrl(''); // Reset the GHS URL

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

        // Step 2: Fetch GHS Classification XML data
        const ghsResponse = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/XML/?heading=GHS%20Classification`
        );
        
        if (!ghsResponse.ok) {
          throw new Error(`Error fetching GHS data: ${ghsResponse.status} - ${ghsResponse.statusText}`);
        }

        const ghsData = await ghsResponse.text();  // Get XML as text
        console.log('GHS XML Data:', ghsData);  // Log the XML to inspect

        // Step 3: Parse XML to extract SVG file URLs and the "Learn more" link
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(ghsData, 'application/xml');
        
        // Step 4: Extract SVG URLs under the GHS Classification section
        const svgFiles = [];
        const sections = xmlDoc.getElementsByTagName('Section');
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          const tocHeading = section.getElementsByTagName('TOCHeading')[0]?.textContent;
          
          // Look for the section with 'GHS Classification' heading
          if (tocHeading === 'GHS Classification') {
            const informationElements = section.getElementsByTagName('Information');
            for (let j = 0; j < informationElements.length; j++) {
              const info = informationElements[j];
              const name = info.getElementsByTagName('Name')[0]?.textContent;
              const value = info.getElementsByTagName('Value')[0]?.textContent;
              
              // Look for the 'GHS' SVG URLs in the value field
              if (name && name.includes('Pictogram(s)') && value) {
                const urlMatch = value.match(/https:\/\/pubchem\.ncbi\.nlm\.nih\.gov\/images\/ghs\/GHS\d{2}\.svg/g);
                if (urlMatch) {
                  svgFiles.push(...urlMatch);
                }
              }

              // Find the "Learn more" link
              if (value && value.includes('https://pubchem.ncbi.nlm.nih.gov/ghs/')) {
                setGhsUrl(value);
              }
            }
          }
        }

        // Remove duplicates by converting to a Set and back to an array
        const uniqueSvgFiles = [...new Set(svgFiles)];

        setSvgFiles(uniqueSvgFiles);
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

        {(!loading && !error) && (
          <div className="space-y-4">
            {svgFiles.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">GHS Classification Pictograms</h3>
                <div className="space-y-4">
                  {svgFiles.map((svgUrl, index) => (
                    <div key={index} className="flex justify-center">
                      <img src={svgUrl} alt={`GHS Classification ${index + 1}`} className="max-w-full h-auto" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ghsUrl && (
              <div className="mt-4 text-center">
                <a href={ghsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                  Learn more about GHS Classification
                </a>
              </div>
            )}

            {!svgFiles.length && !ghsUrl && (
              <div className="text-gray-600 text-center py-4">
                <p>No GHS hazard information or pictograms available for this chemical.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChemicalHazardModal;
