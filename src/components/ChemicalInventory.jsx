import React, { useState, useEffect } from 'react';
import { API } from 'aws-amplify';

const ChemicalInventory = () => {
  const [chemicals, setChemicals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchChemicals();
  }, []);

  const fetchChemicals = async () => {
    try {
      setLoading(true);
      console.log('1. Starting API call...');
      const response = await API.get('chbe-inventory-api', '/inventory');
      console.log('2. Raw API Response:', response);
      
      if (!response) {
        throw new Error('No response from API');
      }

      let parsedBody;
      try {
        // If response.body is a string, parse it, otherwise use it as is
        parsedBody = typeof response.body === 'string' 
          ? JSON.parse(response.body)
          : response.body;
        console.log('3. Parsed body:', parsedBody);
      } catch (e) {
        console.error('Error parsing response body:', e);
        throw new Error('Failed to parse API response');
      }

      if (!parsedBody.data) {
        throw new Error('No data found in response');
      }

      // Parse CSV data
      try {
        const rows = parsedBody.data.split('\\r\\n');
        console.log('4. Split rows:', rows);

        const headers = rows[0].split(',');
        console.log('5. Headers:', headers);

        const data = rows.slice(1).map(row => {
          const values = row.split(',');
          console.log('6. Processing row:', row);
          console.log('7. Split values:', values);
          
          const rowObject = {};
          headers.forEach((header, index) => {
            rowObject[header.trim()] = values[index]?.trim() || '';
          });
          console.log('8. Created row object:', rowObject);
          return rowObject;
        });

        console.log('9. Final parsed data:', data);
        setChemicals(data);
        setError(null);
      } catch (e) {
        console.error('Error parsing CSV data:', e);
        throw new Error('Failed to parse CSV data');
      }
    } catch (err) {
      console.error('Error in fetchChemicals:', err);
      setError(err.message || 'Failed to load chemical inventory');
    } finally {
      setLoading(false);
    }
  };

  const filteredChemicals = chemicals.filter(chemical =>
    chemical.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chemical.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chemical.formula?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('10. Filtered chemicals for rendering:', filteredChemicals);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Chemical Inventory Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, formula, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-lg shadow-sm"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Formula</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Unit</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Hazard Level</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Min. Quantity</th>
            </tr>
          </thead>
          <tbody>
            {filteredChemicals.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No chemicals found
                </td>
              </tr>
            ) : (
              filteredChemicals.map((chemical) => (
                <tr key={chemical.chemical_id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {chemical.sds_url ? (
                      <a 
                        href={chemical.sds_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {chemical.name}
                      </a>
                    ) : (
                      chemical.name
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono">{chemical.formula}</td>
                  <td className="px-4 py-3">{chemical.location}</td>
                  <td className="px-4 py-3">
                    <span className={Number(chemical.current_quantity) < Number(chemical.minimum_quantity) ? 'text-red-600 font-medium' : ''}>
                      {chemical.current_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">{chemical.unit}</td>
                  <td className="px-4 py-3">{chemical.hazard_level}</td>
                  <td className="px-4 py-3">{chemical.minimum_quantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChemicalInventory;
