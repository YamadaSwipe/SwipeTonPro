import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AthLoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la vraie page de login (correction de "ath" en "auth")
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirection en cours...</p>
      </div>
    </div>
  );
}
