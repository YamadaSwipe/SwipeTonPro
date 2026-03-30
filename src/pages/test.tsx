import { useEffect } from 'react';

export default function TestPage() {
  useEffect(() => {
    console.log('🧪 Test page loaded');
    console.log('📊 Window object:', typeof window);
    console.log('🌐 Document ready:', !!document);
  }, []);

  return (
    <div style={{ padding: '20px', background: 'red', color: 'white', fontSize: '24px' }}>
      <h1>🧪 PAGE DE TEST</h1>
      <p>Si vous voyez ceci, Next.js fonctionne</p>
      <p>Ouvrez la console pour voir les logs</p>
    </div>
  );
}
