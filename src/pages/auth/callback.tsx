import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data.session) {
          // Récupérer les paramètres de l'URL
          const userType = router.query.userType as string || 'client';
          
          // Vérifier si l'utilisateur existe déjà dans la base de données
          const { data: profile, error: profileError } = await (supabase as any)
            .from('profiles')
            .select('id, role, full_name')
            .eq('id', data.session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          if (!profile) {
            // Créer le profil pour le nouvel utilisateur
            const { error: insertError } = await (supabase as any)
              .from('profiles')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email,
                full_name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0],
                avatar_url: data.session.user.user_metadata?.avatar_url,
                role: userType as 'client' | 'professional',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              throw insertError;
            }

            // Si c'est un professionnel, créer l'entrée dans la table professionals
            if (userType === 'professional') {
              const { error: proError } = await (supabase as any)
                .from('professionals')
                .insert({
                  user_id: data.session.user.id,
                  company_name: data.session.user.user_metadata?.full_name || 'Entreprise',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });

              if (proError) {
                throw proError;
              }
            }

            setStatus('success');
            setMessage(`Compte créé avec succès ! Bienvenue ${data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0]}`);
            
            // Rediriger vers le dashboard approprié après 2 secondes
            setTimeout(() => {
              router.push(userType === 'professional' ? '/professionnel/dashboard' : '/particulier/dashboard');
            }, 2000);
            
          } else {
            // Utilisateur existant - le connecter
            setStatus('success');
            setMessage(`Bon retour ${profile?.full_name || data.session.user.email?.split('@')[0]} !`);
            
            // Rediriger vers le dashboard approprié après 2 secondes
            setTimeout(() => {
              router.push(profile?.role === 'professional' ? '/professionnel/dashboard' : '/particulier/dashboard');
            }, 2000);
          }
        } else {
          throw new Error('Aucune session trouvée');
        }
      } catch (error: any) {
        console.error('Erreur callback auth:', error);
        setStatus('error');
        setMessage(error.message || 'Une erreur est survenue lors de l\'authentification');
        
        // Rediriger vers la page de login après 3 secondes
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    };

    if (router.isReady) {
      handleAuthCallback();
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
      <SEO title="Authentification | SwipeTonPro" />
      
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Authentification en cours...
              </h2>
              <p className="text-gray-600">
                Veuillez patienter pendant que nous vérifions vos informations
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connexion réussie !
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Redirection automatique...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Erreur d'authentification
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                Redirection vers la page de connexion...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
