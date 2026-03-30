// Script pour effacer tous les cookies Supabase et réinitialiser l'authentification
export default function ClearAuth() {
  const clearAllSupabaseCookies = () => {
    // Noms de cookies possibles pour Supabase
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
      'supabase.auth.token',
      'supabase.auth.refreshToken'
    ];

    cookieNames.forEach(name => {
      // Effacer le cookie avec tous les chemins possibles
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=localhost`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.localhost`;
    });

    // Effacer tous les cookies commençant par sb-
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
        console.log(`🗑️ Cleared cookie: ${name}`);
      }
    });

    // Effacer le localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase')) {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared localStorage: ${key}`);
        }
      });
    }

    // Effacer le sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      console.log('🗑️ Cleared sessionStorage');
    }
  };

  const handleRedirect = () => {
    clearAllSupabaseCookies();
    
    // Attendre un peu puis rediriger
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Réinitialiser l'authentification
          </h1>
          
          <p className="text-gray-600 mb-6">
            Cette page va effacer tous les cookies et données d'authentification Supabase, 
            puis vous rediriger vers la page de connexion.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-800 mb-2">Attention:</h3>
            <ul className="text-sm text-yellow-700 text-left space-y-1">
              <li>• Toutes vos sessions seront déconnectées</li>
              <li>• Vous devrez vous reconnecter</li>
              <li>• Les tokens invalides seront supprimés</li>
            </ul>
          </div>

          <button
            onClick={handleRedirect}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Effacer et réinitialiser
          </button>

          <div className="mt-4">
            <a
              href="/debug/auth"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Retour au débogage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
