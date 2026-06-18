import { SEO } from '@/components/SEO';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

export default function VerifyResetPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        console.log('🔍 Vérification du lien de réinitialisation...');
        console.log('Query params:', router.query);

        // Attendre que le router soit prêt
        if (!router.isReady) {
          return;
        }

        // Extraire le token et le type de l'URL
        const { token, type } = router.query;

        if (!token || type !== 'recovery') {
          console.error('❌ Token ou type invalide');
          setError('Lien de réinitialisation invalide');
          setTimeout(() => {
            router.push('/auth/login?error=invalid_link');
          }, 2000);
          return;
        }

        console.log('✅ Token trouvé, vérification avec Supabase...');

        // Vérifier le token avec Supabase
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token as string,
          type: 'recovery',
        });

        if (verifyError || !data.session) {
          console.error('❌ Erreur de vérification:', verifyError);
          setError('Ce lien de réinitialisation est invalide ou a expiré');
          setTimeout(() => {
            router.push('/auth/login?error=token_expired');
          }, 2000);
          return;
        }

        console.log('✅ Token vérifié, session créée pour:', data.user?.email);

        // La session est automatiquement créée par verifyOtp
        // Rediriger vers la page de réinitialisation
        router.push('/auth/reset-password');
      } catch (error: any) {
        console.error('❌ Erreur lors de la vérification:', error);
        setError('Une erreur est survenue lors de la vérification du lien');
        setTimeout(() => {
          router.push('/auth/login?error=verification_failed');
        }, 2000);
      }
    };

    verifyAndRedirect();
  }, [router, router.isReady]);

  return (
    <>
      <SEO
        title="Vérification - SwipeTonPro"
        description="Vérification du lien de réinitialisation"
      />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="text-center py-12">
            {error ? (
              <>
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p className="text-red-700 font-medium mb-2">{error}</p>
                <p className="text-sm text-gray-600">
                  Redirection vers la page de connexion...
                </p>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-700 font-medium mb-2">
                  Vérification du lien de réinitialisation...
                </p>
                <p className="text-sm text-gray-600">
                  Veuillez patienter quelques instants
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
