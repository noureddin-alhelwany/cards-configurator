import './App.css';
import ProofPage from './proof/ProofPage';
import SelectionPage from './selection/SelectionPage';

export default function App() {
  if (window.location.pathname.startsWith('/render/proof')) {
    return <ProofPage />;
  }

  return <SelectionPage />;
}
