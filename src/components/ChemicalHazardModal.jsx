import React, { useState, useEffect } from 'react';

const ChemicalHazardModal = ({ chemical, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hazardInfo, setHazardInfo] = useState(null);
  const [svgFiles, setSvgFiles] = useState([]);

  useEffect(() => {
    const fetchHazardInfo = async () => {
      if (!isOpen || !chemical) return;

      setLoading(true);
      setError(null);
      setSvgFiles([]);  // Reset the SVG files list

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

        // Step 3: Parse XML to extract SVG file URLs
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(ghsData, 'application/xml');
        
        // Log the structure of the XML to inspect
        console.log('Parsed XML:', xmlDoc);

        // Step 4: Extract SVG URLs
        const svgFiles = [];
        const informationElements = xmlDoc.getElementsByTagName('Information');
        for (let i = 0; i < informationElements.length; i++) {
          const info = informationElements[i];
          const name = info.getElementsByTagName('Name')[0]?.textContent;
          const value = info.getElementsByTagName('Value')[0]?.textContent;
          
          // Look for the 'GHS' SVG URLs in the value field
          if (name && name.includes('Pictogram(s)') && value) {
            const urlMatch = value.match(/https:\/\/pubchem\.ncbi\.nlm\.nih\.gov\/images\/ghs\/GHS\d{2}\.svg/g);
            if (urlMatch) {
              svgFiles.push(...urlMatch);
            }
          }
        }

        setSvgFiles(svgFiles);

        // Optional: Process and extract hazard statements if needed
        const processHazards = (xmlDoc) => {
          const hazards = {
            statements: [],
            signalWord: null
          };

          const sections = xmlDoc.getElementsByTagName('Section');
          for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const heading = section.getElementsByTagName('TOCHeading')[0]?.textContent;

            if (heading === 'GHS Classification') {
              const information = section.getElementsByTagName('Information');
              for (let j = 0; j < information.length; j++) {
                const info = information[j];
                const text = info.textContent;
                if (text.startsWith('Signal Word:')) {
                  hazards.signalWord = text.replace('Signal Word:', '').trim();
                } else if (text.includes('H')) {
                  hazards.statements.push(text);
                }
              }
            }
          }

          return hazards;
        };

        const hazards = processHazards(xmlDoc);
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

        {svgFiles.length > 0 && !loading && (
          <div className="mt-4">
            <h3 className="font-semibold mb-3">GHS Classification SVGs</h3>
            <div className="space-y-4">
              {svgFiles.map((svgUrl, index) => (
                <div key={index} className="flex justify-center">
                  <img src={svgUrl} alt={`GHS Classification ${index + 1}`} className="max-w-full h-auto" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && !hazardInfo && !svgFiles.length && (
          <div className="text-gray-600 text-center py-4">
            <p>No hazard information or SVGs available for this chemical.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChemicalHazardModal;
