import { useEffect, useState } from 'react';
import './App.css';
import OrderPage from './orders/OrderPage';
import ProofPage from './proof/ProofPage';
import SelectionPage from './selection/SelectionPage';

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (pathname.startsWith('/render/proof')) {
    return <ProofPage />;
  }

  if (pathname.startsWith('/render/orders/')) {
    const orderId = pathname.split('/').filter(Boolean).pop() ?? '';
    return <OrderPage orderId={orderId} />;
  }

  return <SelectionPage />;
}
