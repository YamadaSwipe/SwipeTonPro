import { SEO } from '@/components/SEO';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Vérifier si nous avons une session de réinitialisation ou un code PKCE
    const checkResetSession = async () => {
      try {
        console.log('🔍 Checking reset session...');

        // 1. Vérifier si un code PKCE est présent dans l'URL (nouveau flow Supabase)
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const type = url.searchParams.get('type');

        // 1b. Supabase Auth envoie aussi les tokens dans le hash fragment (#access_token=...)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');

        if (accessToken && hashType === 'recovery') {
          console.log(
            '🔑 Access token trouvé dans le hash, établissement de la session...'
          );
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('❌ Erreur setSession:', error);
            toast({
              title: '❌ Lien invalide',
              description:
                'Ce lien de réinitialisation est invalide ou a expiré',
              variant: 'destructive',
            });
            router.push('/auth/forgot-password');
            return;
          }

          if (data.session) {
            console.log('✅ Session établie via access token');
            // Nettoyer le hash pour ne pas exposer le token
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search
            );
            setTokenValid(true);
            setIsValidating(false);
            return;
          }
        }

        if (code) {
          console.log('🔄 Code PKCE trouvé, échange du token...');
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('❌ Erreur échange code:', error);
            toast({
              title: '❌ Lien invalide',
              description:
                'Ce lien de réinitialisation est invalide ou a expiré',
              variant: 'destructive',
            });
            router.push('/auth/forgot-password');
            return;
          }

          if (data.session) {
            console.log('✅ Session récupérée via PKCE');
            setTokenValid(true);
            setIsValidating(false);
            return;
          }
        }

        // 2. Ancien flow : vérifier si nous avons déjà une session active
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Session check error:', error);
          toast({
            title: '❌ Erreur',
            description:
              'Impossible de vérifier la session de réinitialisation',
            variant: 'destructive',
          });
          router.push('/auth/forgot-password');
          return;
        }

        if (!session) {
          console.log('❌ No active session, redirecting...');
          toast({
            title: '❌ Lien invalide',
            description: 'Ce lien de réinitialisation est invalide ou a expiré',
            variant: 'destructive',
          });
          router.push('/auth/forgot-password');
          return;
        }

        console.log('✅ Valid reset session found');
        setTokenValid(true);
        setIsValidating(false);
      } catch (error) {
        console.error('❌ Reset session error:', error);
        toast({
          title: '❌ Erreur',
          description: 'Impossible de valider le lien de réinitialisation',
          variant: 'destructive',
        });
        router.push('/auth/forgot-password');
      }
    };

    checkResetSession();
  }, [router, toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Réinitialiser les messages
    setErrorMessage('');
    setSuccessMessage('');

    if (!tokenValid) {
      setErrorMessage(
        'Session invalide. Veuillez demander une nouvelle réinitialisation.'
      );
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return;
    }

    // Vérifier que le mot de passe n'est pas trop simple ou identique à l'email
    if (
      password.toLowerCase() === 'password' ||
      password.toLowerCase() === '12345678' ||
      password.length < 8
    ) {
      setErrorMessage(
        "Choisissez un mot de passe plus sécurisé (8+ caractères, pas 'password' ou '12345678')"
      );
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Updating password...');

      // Pour la réinitialisation, utiliser la méthode dédiée
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('❌ Password update error:', error);

        // Message d'erreur personnalisé pour le mot de passe identique
        if (error.message?.includes('different from the old password')) {
          setErrorMessage(
            "Le nouveau mot de passe doit être différent de l'ancien"
          );
        } else {
          setErrorMessage(
            error.message || 'Impossible de mettre à jour le mot de passe'
          );
        }

        setLoading(false);
        return;
      }

      console.log('✅ Password updated successfully');

      setSuccessMessage('Votre mot de passe a été réinitialisé avec succès');

      // Rediriger vers la page de connexion
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      setErrorMessage('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">
              Validation du lien de réinitialisation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Nouveau mot de passe - SwipeTonPro 2.0"
        description="Créez un nouveau mot de passe pour votre compte"
      />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Nouveau mot de passe
            </CardTitle>
            <CardDescription>
              Choisissez un mot de passe sécurisé pour votre compte
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Messages d'erreur et de succès */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="•••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(''); // Effacer l'erreur lors de la saisie
                    }}
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirmer le mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="•••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage(''); // Effacer l'erreur lors de la saisie
                  }}
                  required
                  minLength={8}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !tokenValid}
              >
                {loading
                  ? 'Modification en cours...'
                  : 'Réinitialiser le mot de passe'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                <a
                  href="/auth/login"
                  className="text-orange-600 hover:text-orange-800 font-medium"
                >
                  Retour à la connexion
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
