import { useState, useEffect } from 'react';
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
import { validateEmail, validatePhone } from '@/utils/validation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  HardHat,
  CheckCircle,
  Phone,
  MapPin,
} from 'lucide-react';
import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'client_signup_progress';

export default function CreateAccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ── Chargement depuis localStorage ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          address: parsed.address || '',
          city: parsed.city || '',
          postalCode: parsed.postalCode || '',
          // Ne pas restaurer les mots de passe pour sécurité
        }));
        toast({
          title: 'Informations récupérées',
          description: 'Vos informations ont été restaurées',
        });
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }, [toast]);

  // ── Auto-save vers localStorage ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (success) return; // Ne pas sauvegarder après succès

    const dataToSave = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [formData, success]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('Le prénom est requis');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Le nom est requis');
      return false;
    }
    const trimmedEmail = formData.email.trim().toLowerCase();
    const emailValidation = validateEmail(trimmedEmail);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Email invalide');
      return false;
    }

    if (formData.phone.trim()) {
      const phoneValidation = validatePhone(formData.phone.trim());
      if (!phoneValidation.isValid) {
        setError(phoneValidation.error || 'Téléphone invalide');
        return false;
      }
    }

    if (!formData.address.trim()) {
      setError("L'adresse est requise");
      return false;
    }
    if (!formData.city.trim()) {
      setError('La ville est requise');
      return false;
    }
    if (!formData.postalCode.trim()) {
      setError('Le code postal est requis');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Créer le compte Supabase
      const email = formData.email.trim().toLowerCase();
      const signUpResult = await authService.signUp(email, formData.password);

      let user = signUpResult.user;
      const signUpError = signUpResult.error;

      if (signUpError || !user) {
        // Cas spécial : erreur d'envoi d'email de confirmation (ne pas bloquer)
        if (
          signUpError?.message?.includes('email') ||
          signUpError?.message?.includes('confirmation') ||
          signUpError?.message?.includes('sending')
        ) {
          // Tenter de se connecter avec les identifiants
          const signInResult = await authService.signIn(
            formData.email,
            formData.password
          );
          if (signInResult.user) {
            user = signInResult.user;
          } else {
            throw signUpError;
          }
        }
        // Cas spécial : utilisateur existe déjà mais profil manquant
        else if (
          signUpError?.message?.includes('User already registered') ||
          signUpError?.code === '422'
        ) {
          // Tenter de se connecter
          const signInResult = await authService.signIn(
            formData.email,
            formData.password
          );
          if (signInResult) {
            // Vérifier si le profil existe
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', signInResult.user.id)
              .single();

            if (!profile) {
              // Créer le profil manquant
              const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                  id: signInResult.user.id,
                  email: formData.email,
                  full_name: `${formData.firstName} ${formData.lastName}`,
                  phone: formData.phone,
                  address: formData.address,
                  city: formData.city,
                  postal_code: formData.postalCode,
                  role: 'client',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });

              if (profileError) {
                throw new Error('Erreur lors de la création du profil');
              }
            }

            toast({
              title: 'Compte récupéré',
              description: 'Votre profil a été configuré avec succès',
            });

            router.push('/particulier/dashboard');
            return;
          }
        }

        throw signUpError || new Error('Erreur lors de la création du compte');
      }

      // Se connecter automatiquement
      const signInResult = await authService.signIn(
        formData.email,
        formData.password
      );
      if (!signInResult) {
        throw new Error('Erreur lors de la connexion automatique');
      }

      // Confirmer l'email automatiquement via le service role
      try {
        const confirmResponse = await axios.post('/api/auth/confirm-email', {
          userId: user.id,
        });
        if (!confirmResponse.data.success) {
          throw new Error('Email confirmation failed');
        }
      } catch (confirmError: any) {
        // Si la confirmation échoue, continuer quand même
        // L'utilisateur pourra se connecter manuellement si nécessaire
      }

      // Créer le profil utilisateur avec rôle client
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email,
        full_name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postalCode,
        role: 'client',
      });

      if (profileError) {
        // Si le profil existe déjà, essayer de le mettre à jour
        if (profileError.code === '23505') {
          // Unique violation
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: `${formData.firstName} ${formData.lastName}`,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              postal_code: formData.postalCode,
              role: 'client',
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('Erreur mise à jour profil:', updateError);
          }
        } else {
          console.error('Erreur création profil:', profileError);
        }
      }

      // Envoyer l'email de bienvenue personnalisé depuis l'admin
      try {
        await axios.post('/api/send-welcome-email', {
          userId: user.id,
          userType: 'client',
        });
      } catch (emailError) {
        // Ne pas bloquer si l'email échoue
      }

      // Notifier admin + support + team
      try {
        await axios.post('/api/notify-client-inscription', {
          userId: user.id,
        });
      } catch (notifError) {
        // Ne pas bloquer si les notifications échouent
      }

      setSuccess(true);

      // Nettoyer le localStorage après inscription réussie
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }

      // Vérifier s'il y a une redirection après le diagnostic
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');

      // Rediriger vers le dashboard ou la page demandée après 3 secondes
      setTimeout(() => {
        if (redirect === 'diagnostic') {
          router.push('/particulier/diagnostic');
        } else {
          router.push('/particulier/dashboard');
        }
      }, 3000);
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        setError('Cet email est déjà utilisé. Veuillez vous connecter.');
      } else if (err.message?.includes('password')) {
        setError('Le mot de passe ne respecte pas les critères de sécurité');
      } else {
        setError(err.message || 'Erreur lors de la création du compte');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <SEO
          title="Compte créé - SwipeTonPro"
          description="Votre compte a été créé avec succès"
        />
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-construction-grid opacity-5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

          <div className="w-full max-w-md relative z-10">
            <Card className="border-2 border-primary shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <CheckCircle className="h-12 w-12 text-primary" />
                  </div>
                </div>

                <h2 className="text-2xl font-heading font-bold mb-3">
                  Compte créé! 🎉
                </h2>
                <p className="text-muted-foreground mb-2">
                  Bienvenue <strong>{formData.firstName}</strong>!
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Un email de confirmation a été envoyé à{' '}
                  <strong>{formData.email}</strong>
                </p>

                <div className="bg-primary/10 p-4 rounded-lg mb-6 text-left">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Prochaines étapes:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>✅ Compte créé avec succès</li>
                    <li>📧 Email de confirmation envoyé</li>
                    <li>⏳ Redirection vers votre estimation...</li>
                  </ul>
                </div>

                <p className="text-xs text-muted-foreground">
                  Redirection automatique dans quelques secondes...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Créer un compte - SwipeTonPro"
        description="Créez votre compte pour commencer votre estimation"
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
              href="/particulier"
              className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Retour</span>
            </Link>

            <div className="flex items-center justify-center gap-2 mb-4">
              <HardHat className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-heading font-black tracking-tight">
                SwipeTon<span className="text-primary">Pro</span>
              </h1>
            </div>

            <p className="text-muted-foreground">
              Créez votre compte pour continuer
            </p>
          </div>

          {/* Create Account Card */}
          <Card className="border-2 border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-heading font-bold flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-primary" />
                Créer un compte
              </CardTitle>
              <CardDescription>
                Complétez votre profil pour commencer
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCreateAccount} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="animate-slide-down">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-xs font-semibold"
                    >
                      Prénom
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Jean"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs font-semibold">
                      Nom
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Dupont"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Adresse
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="123 Rue de la République"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs font-semibold">
                      Ville
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="Paris"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="postalCode"
                      className="text-xs font-semibold"
                    >
                      Code postal
                    </Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      placeholder="75001"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="h-10 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 caractères
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="flex items-center gap-2 text-xs font-semibold"
                  >
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="h-10 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-primary to-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Créer mon compte
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  Vous avez déjà un compte ?{' '}
                  <Link
                    href="/auth/login"
                    className="text-primary hover:underline font-semibold"
                  >
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info Box */}
          <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">
              <strong>💡 Astuce :</strong> Créez maintenant votre compte pour
              accéder à votre estimation personnalisée et recevoir les
              propositions des professionnels.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
