import React from 'react';

export default function TestSimple() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🧪 PAGE TEST SIMPLE</h1>
      <p>Si vous voyez cette page, Next.js fonctionne.</p>
      <p>Le problème vient de l'AuthContext.</p>
      <a href="/auth/login">Aller à Login</a>
    </div>
  );
}
