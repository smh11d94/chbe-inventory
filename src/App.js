import { Amplify } from 'aws-amplify';
import config from './aws-exports';
import ChemicalInventory from './components/ChemicalInventory';
import ErrorBoundary from './components/ErrorBoundary';

Amplify.configure(config);

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">CHBE Inventory</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <ErrorBoundary>
            <ChemicalInventory />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

export default App;
