/**
 * @fileoverview Page de connexion sécurisée et simplifiée
 * @author Senior Architect
 * @version 3.0.0
 *
 * Fonctionnalités :
 * - Protection SSR intégrée
 * - Authentification centralisée via useAuth()
 * - Redirections unifiées avec router.push()
 * - Suppression des appels directs Supabase
 * - Logs de débogage uniquement en développement
 * - Logique simplifiée
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  ArrowLeft,
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  HardHat,
} from 'lucide-react';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function LoginPage() {
  // Protection SSR
  if (typeof window === 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🛡️ LoginPage: SSR detected, returning loading state');
    }
    return null;
  }

  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Simplifier la gestion des erreurs
  const getErrorMessage = useCallback((err: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔍 LoginPage: Error analysis:', {
        message: err?.message,
        code: err?.code,
      });
    }

    if (err?.message?.includes('Invalid login credentials')) {
      return 'Email ou mot de passe incorrect';
    }
    if (err?.message?.includes('Email not confirmed')) {
      return 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte mail.';
    }
    if (err?.message?.includes('Database')) {
      return 'Erreur de base de données. Veuillez réessayer.';
    }
    return err?.message || 'Erreur lors de la connexion';
  }, []);

  // Handler de connexion simplifié
  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (process.env.NODE_ENV === 'development') {
        console.warn('🚀 LoginPage: Login attempt started');
      }

      setLoading(true);
      setError('');

      try {
        // Utiliser uniquement useAuth().login() pour l'authentification
        await login(email, password);

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ LoginPage: Login successful, redirecting...');
        }

        // Redirection unifiée - useAuth() gère automatiquement la redirection
        router.push('/');
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ LoginPage: Login failed:', err);
        }
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, router, getErrorMessage]
  );

  return (
    <>
      <SEO
        title="Connexion - SwipeTonPro"
        description="Connectez-vous à votre compte SwipeTonPro"
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-construction-grid opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Retour à l'accueil</span>
            </Link>

            <div className="flex items-center justify-center gap-2 mb-4">
              <HardHat className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-heading font-black tracking-tight">
                SwipeTon<span className="text-primary">Pro</span>
              </h1>
            </div>

            <p className="text-muted-foreground">
              Connectez-vous à votre compte
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-2 border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-heading font-bold flex items-center gap-2">
                <LogIn className="w-6 h-6 text-primary" />
                Connexion
              </CardTitle>
              <CardDescription>
                Accédez à votre espace personnel
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="animate-slide-down">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Link
                    href="/auth/forgot-password"
                    className="text-primary hover:underline font-medium"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Se connecter
                    </>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continuer avec
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <GoogleAuthButton mode="signin" />
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  Pas encore de compte ?{' '}
                  <Link
                    href="/particulier"
                    className="text-primary hover:underline font-semibold"
                  >
                    Je suis particulier
                  </Link>
                  {' · '}
                  <Link
                    href="/professionnel"
                    className="text-primary hover:underline font-semibold"
                  >
                    Je suis professionnel
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary mb-1">500+</div>
                <div className="text-xs text-muted-foreground">
                  Professionnels
                </div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/5 border-secondary/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-secondary mb-1">
                  1200+
                </div>
                <div className="text-xs text-muted-foreground">
                  Projets actifs
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
