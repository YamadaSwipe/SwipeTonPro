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

import { useState, useCallback, useEffect } from 'react';
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
  Eye,
  EyeOff,
} from 'lucide-react';
export default function LoginPage() {
  const router = useRouter();
  const { login, role } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Protection SSR - must be after all hooks
  if (typeof window === 'undefined') {
    return null;
  }

  // Redirection automatique après connexion réussie
  useEffect(() => {
    if (!loginSuccess || !role) return;

    const destination =
      role === 'admin' || role === 'super_admin'
        ? '/admin/dashboard'
        : role === 'professional'
          ? '/professionnel/dashboard'
          : '/particulier/dashboard';

    router.push(destination);
  }, [loginSuccess, role, router]);

  // Simplifier la gestion des erreurs
  const getErrorMessage = useCallback((err: any) => {
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

      setLoading(true);
      setError('');

      try {
        const loginResult = await login(email, password);

        if (loginResult.success) {
          setLoginSuccess(true);
        } else {
          setError(loginResult.error || 'Erreur de connexion');
        }
      } catch (err: any) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, getErrorMessage]
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
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                  >
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="•••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
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
        </div>
      </div>
    </>
  );
}
