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
    // Vérifier si nous avons un token de récupération valide
    const checkResetSession = async () => {
      try {
        console.log('🔍 Vérification du token de récupération...');
        console.log('🌐 URL actuelle:', window.location.href);

        // Vérifier si nous avons un token dans le hash (méthode forcée)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get('access_token');
        const tokenType = hashParams.get('type');

        // Vérifier aussi les paramètres de query (fallback)
        const urlParams = new URLSearchParams(window.location.search);
        const queryToken = urlParams.get('token');

        // Vérifier d'abord si nous avons des tokens dans l'URL
        console.log('🔍 URL complète:', window.location.href);
        console.log('🔍 Hash:', window.location.hash);
        console.log('🔍 Search:', window.location.search);

        if (accessToken && tokenType === 'recovery') {
          console.log(
            '🔑 Token de récupération trouvé:',
            accessToken.substring(0, 20) + '...'
          );
          console.log('🔗 URL complète:', window.location.href);
          console.log('🔗 Hash complet:', window.location.hash);
          console.log('🔗 Paramètres hash:', Array.from(hashParams.entries()));

          // Pour les liens de récupération Supabase, la session est créée automatiquement
          // Il suffit de vérifier que la session existe après un court délai
          console.log('🔄 Vérification de la session créée automatiquement...');

          // Attendre un peu que Supabase traite le token automatiquement
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Vérifier si une session valide a été créée
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();

          if (sessionError) {
            console.error('❌ Erreur session:', sessionError);
            setErrorMessage(
              'Erreur lors de la validation du lien. Veuillez demander un nouveau lien.'
            );
            setIsValidating(false);
            return;
          }

          if (sessionData?.session?.user) {
            console.log(
              '✅ Session créée automatiquement:',
              sessionData.session.user.email
            );
            setTokenValid(true);
            setIsValidating(false);
            return;
          }

          // Si pas de session, essayer avec exchangeCodeForSession (pour les nouveaux liens)
          console.log('🔄 Tentative avec exchangeCodeForSession...');
          try {
            const { data, error } =
              await supabase.auth.exchangeCodeForSession(accessToken);

            if (error) {
              console.error('❌ Erreur exchangeCodeForSession:', error);
              console.error('❌ Détails erreur:', error.message);
              setErrorMessage(
                'Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.'
              );
              setIsValidating(false);
              return;
            }

            if (data?.session?.user) {
              console.log(
                '✅ Session créée via exchangeCodeForSession:',
                data.session.user.email
              );
              setTokenValid(true);
              setIsValidating(false);
              return;
            }
          } catch (exchangeError) {
            console.error('❌ Erreur exchangeCodeForSession:', exchangeError);
          }

          // Dernière tentative : attendre plus longtemps et revérifier
          console.log('🔄 Dernière tentative - attendre et revérifier...');
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const { data: finalSessionData } = await supabase.auth.getSession();
          if (finalSessionData?.session?.user) {
            console.log(
              '✅ Session trouvée après délai:',
              finalSessionData.session.user.email
            );
            setTokenValid(true);
            setIsValidating(false);
            return;
          }

          console.log('❌ Aucune session valide trouvée');
          console.log('❌ Session finale:', finalSessionData);
          setErrorMessage(
            'Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.'
          );
          setTokenValid(false);
          setIsValidating(false);

          // Nettoyer le hash dans tous les cas
          if (window.location.hash) {
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search
            );
          }
        } else if (queryToken) {
          console.log(
            '🔑 Token query trouvé:',
            queryToken.substring(0, 20) + '...'
          );
          setTokenValid(true);
          setIsValidating(false);
        } else {
          console.log('❌ Pas de token de récupération valide trouvé');
          console.log('accessToken:', accessToken);
          console.log('tokenType:', tokenType);
          console.log('queryToken:', queryToken);
          setErrorMessage(
            'Ce lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.'
          );
          setTokenValid(false);
        }

        // Finaliser la validation
        setIsValidating(false);
      } catch (error) {
        console.error('❌ Erreur vérification:', error);
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
      console.log('🔄 Vérification de la session...');

      // Attendre un peu pour éviter les conflits de lock
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Vérifier explicitement que nous avons une session valide
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('❌ Pas de session active:', sessionError);
        setErrorMessage(
          'Session invalide ou expirée. Veuillez demander un nouveau lien de réinitialisation.'
        );
        setLoading(false);
        return;
      }

      console.log('✅ Session validée pour:', session.user.email);
      console.log('🔄 Mise à jour du mot de passe...');

      // Mettre à jour le mot de passe avec retry pour éviter les locks
      let updateError = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const { error } = await supabase.auth.updateUser({
            password: password,
          });

          if (error) {
            updateError = error;
            if (
              error.message?.includes('Lock') &&
              retryCount < maxRetries - 1
            ) {
              console.log(
                `🔄 Lock detected, retrying... (${retryCount + 1}/${maxRetries})`
              );
              await new Promise((resolve) => setTimeout(resolve, 1000));
              retryCount++;
              updateError = null; // Reset pour retry
            }
          } else {
            console.log('✅ Password updated successfully');
            break; // Succès, sortir de la boucle
          }
        } catch (err) {
          console.error('❌ Update error:', err);
          if (err.message?.includes('Lock') && retryCount < maxRetries - 1) {
            console.log(
              `🔄 Lock detected, retrying... (${retryCount + 1}/${maxRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
            retryCount++;
          } else {
            updateError = err;
            break;
          }
        }
      }

      if (updateError) {
        console.error('❌ Password update error after retries:', updateError);

        // Message d'erreur personnalisé
        if (updateError.message?.includes('different from the old password')) {
          setErrorMessage(
            "Le nouveau mot de passe doit être différent de l'ancien"
          );
        } else if (updateError.message?.includes('Lock')) {
          setErrorMessage(
            'Erreur de synchronisation. Veuillez réessayer dans quelques instants.'
          );
        } else {
          setErrorMessage(
            updateError.message || 'Impossible de mettre à jour le mot de passe'
          );
        }

        setLoading(false);
        return;
      }

      setSuccessMessage('Votre mot de passe a été réinitialisé avec succès');

      // Attendre avant de déconnecter pour éviter les conflits
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Déconnecter l'utilisateur pour nettoyer la session
      try {
        await supabase.auth.signOut();
        console.log('👋 Session de récupération terminée');
      } catch (signOutError) {
        console.warn('⚠️ SignOut error (ignorable):', signOutError);
        // Continuer même si signOut échoue
      }

      // Rediriger vers la page de connexion
      setTimeout(() => {
        router.push('/particulier');
      }, 2000);
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      setErrorMessage(
        'Une erreur inattendue est survenue. Veuillez réessayer.'
      );
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
