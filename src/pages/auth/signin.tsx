import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la page de login existante
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirection...</p>
      </div>
    </div>
  );
}
