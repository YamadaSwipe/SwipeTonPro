/**
 * @fileoverview Page d'inscription professionnelle sécurisée
 * @author Senior Architect
 * @version 3.0.0
 *
 * Fonctionnalités :
 * - Protection SSR intégrée
 * - Utilisation de useAuth() pour l'inscription
 * - Redirections sécurisées avec router.push()
 * - Suppression des appels directs Supabase
 * - Logs de débogage uniquement en développement
 * - Stabilisation sans refactorisation massive
 */

import { SEO } from '@/components/SEO';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Upload,
  FileText,
  Shield,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Types pour améliorer la lisibilité
interface BasicInfo {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  siret: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  description: string;
}

interface Documents {
  kbis: File | null;
  insurance: File | null;
  idCard: File | null;
}

interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Realization {
  title: string;
  description: string;
  images: File[];
  category: string;
}

interface Portfolio {
  experiences: Experience[];
  realizations: Realization[];
  skills: string[];
  workAreas: string[];
}

interface FormData {
  step: number;
  loading: boolean;
  error: string;
  success: boolean;
  basicInfo: BasicInfo;
  documents: Documents;
  portfolio: Portfolio;
}

export default function ProfessionalSignupPage() {
  // Protection SSR
  if (typeof window === 'undefined') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🛡️ ProSignupPage: SSR detected, returning loading state');
    }
    return null;
  }

  const router = useRouter();

  // État unifié pour réduire la complexité
  const [formData, setFormData] = useState<FormData>({
    step: 1,
    loading: false,
    error: '',
    success: false,
    basicInfo: {
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      siret: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      description: '',
    },
    documents: {
      kbis: null,
      insurance: null,
      idCard: null,
    },
    portfolio: {
      experiences: [],
      realizations: [],
      skills: [],
      workAreas: [],
    },
  });

  // Données statiques mémoisées pour éviter les recréations
  const categories = useMemo(
    () => [
      'Rénovation complète',
      'Rénovation partielle',
      'Construction neuve',
      'Extension',
      'Électricité',
      'Plomberie',
      'Menuiserie',
      'Peinture',
      'Cuisine',
      'Salle de bain',
      'Toiture',
      'Isolation',
      'Carrelage/Sols',
      'CVC/Chauffage',
      'Aménagement',
      'Jardin/Paysage',
      'Piscine',
      'Terrasse/Balcon',
      'Clôture/Portail',
      'Surélévation',
      'Décoration',
      'Rénovation énergétique',
      'Démolition/Gros œuvre',
      'Autre',
    ],
    []
  );

  const departments = useMemo(
    () => [
      '75 (Paris)',
      '77 (Seine-et-Marne)',
      '78 (Yvelines)',
      '91 (Essonne)',
      '92 (Hauts-de-Seine)',
      '93 (Seine-Saint-Denis)',
      '94 (Val-de-Marne)',
      "95 (Val-d'Oise)",
      '69 (Rhône)',
      '69 (Métropole de Lyon)',
      '13 (Bouches-du-Rhône)',
      '06 (Alpes-Maritimes)',
      '31 (Haute-Garonne)',
    ],
    []
  );

  // Handlers optimisés avec useCallback
  const updateBasicInfo = useCallback(
    (field: keyof BasicInfo, value: string) => {
      setFormData((prev) => ({
        ...prev,
        basicInfo: { ...prev.basicInfo, [field]: value },
      }));
    },
    []
  );

  const updateDocuments = useCallback(
    (type: keyof Documents, file: File | null) => {
      setFormData((prev) => ({
        ...prev,
        documents: { ...prev.documents, [type]: file },
      }));
    },
    []
  );

  const updatePortfolio = useCallback((updates: Partial<Portfolio>) => {
    setFormData((prev) => ({
      ...prev,
      portfolio: { ...prev.portfolio, ...updates },
    }));
  }, []);

  const setStep = useCallback((step: number) => {
    setFormData((prev) => ({ ...prev, step }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setFormData((prev) => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string) => {
    setFormData((prev) => ({ ...prev, error }));
  }, []);

  const setSuccess = useCallback((success: boolean) => {
    setFormData((prev) => ({ ...prev, success }));
  }, []);

  // Handlers simplifiés et optimisés
  const addExperience = useCallback(() => {
    const newExperience: Experience = {
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
    };
    updatePortfolio({
      experiences: [...formData.portfolio.experiences, newExperience],
    });
  }, [formData.portfolio.experiences, updatePortfolio]);

  const updateExperience = useCallback(
    (index: number, field: keyof Experience, value: string) => {
      const updatedExperiences = formData.portfolio.experiences.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      );
      updatePortfolio({ experiences: updatedExperiences });
    },
    [formData.portfolio.experiences, updatePortfolio]
  );

  const removeExperience = useCallback(
    (index: number) => {
      const filteredExperiences = formData.portfolio.experiences.filter(
        (_, i) => i !== index
      );
      updatePortfolio({ experiences: filteredExperiences });
    },
    [formData.portfolio.experiences, updatePortfolio]
  );

  const addRealization = useCallback(() => {
    const newRealization: Realization = {
      title: '',
      description: '',
      images: [],
      category: '',
    };
    updatePortfolio({
      realizations: [...formData.portfolio.realizations, newRealization],
    });
  }, [formData.portfolio.realizations, updatePortfolio]);

  const updateRealization = useCallback(
    (index: number, field: keyof Realization, value: any) => {
      const updatedRealizations = formData.portfolio.realizations.map(
        (real, i) => (i === index ? { ...real, [field]: value } : real)
      );
      updatePortfolio({ realizations: updatedRealizations });
    },
    [formData.portfolio.realizations, updatePortfolio]
  );

  const removeRealization = useCallback(
    (index: number) => {
      const filteredRealizations = formData.portfolio.realizations.filter(
        (_, i) => i !== index
      );
      updatePortfolio({ realizations: filteredRealizations });
    },
    [formData.portfolio.realizations, updatePortfolio]
  );

  const addSkill = useCallback(
    (skill: string) => {
      if (skill && !formData.portfolio.skills.includes(skill)) {
        updatePortfolio({
          skills: [...formData.portfolio.skills, skill],
        });
      }
    },
    [formData.portfolio.skills, updatePortfolio]
  );

  const removeSkill = useCallback(
    (skill: string) => {
      const filteredSkills = formData.portfolio.skills.filter(
        (s) => s !== skill
      );
      updatePortfolio({ skills: filteredSkills });
    },
    [formData.portfolio.skills, updatePortfolio]
  );

  const addWorkArea = useCallback(
    (area: string) => {
      if (area && !formData.portfolio.workAreas.includes(area)) {
        updatePortfolio({
          workAreas: [...formData.portfolio.workAreas, area],
        });
      }
    },
    [formData.portfolio.workAreas, updatePortfolio]
  );

  const removeWorkArea = useCallback(
    (area: string) => {
      const filteredWorkAreas = formData.portfolio.workAreas.filter(
        (a) => a !== area
      );
      updatePortfolio({ workAreas: filteredWorkAreas });
    },
    [formData.portfolio.workAreas, updatePortfolio]
  );

  // Validation simplifiée
  const validateStep = useCallback(() => {
    const { basicInfo, documents, portfolio } = formData;

    switch (formData.step) {
      case 1:
        if (
          !basicInfo.email ||
          !basicInfo.password ||
          !basicInfo.companyName ||
          !basicInfo.siret ||
          !basicInfo.phone
        ) {
          setError('Veuillez remplir tous les champs obligatoires');
          return false;
        }
        if (basicInfo.password !== basicInfo.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          return false;
        }
        break;
      case 2:
        if (!documents.kbis || !documents.insurance || !documents.idCard) {
          setError('Veuillez télécharger tous les documents requis');
          return false;
        }
        break;
      case 3:
        if (
          portfolio.experiences.length === 0 ||
          portfolio.realizations.length === 0
        ) {
          setError(
            'Veuillez ajouter au moins une expérience et une réalisation'
          );
          return false;
        }
        break;
    }
    return true;
  }, [formData, setError]);

  const nextStep = useCallback(() => {
    if (validateStep()) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('📋 ProSignupPage: Moving to step', formData.step + 1);
      }
      setError('');
      setStep(formData.step + 1);
    }
  }, [validateStep, formData.step, setError, setStep]);

  const prevStep = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('📋 ProSignupPage: Moving to step', formData.step - 1);
    }
    setError('');
    setStep(formData.step - 1);
  }, [setError, setStep]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateStep()) return;

      setLoading(true);
      setError('');

      try {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🚀 ProSignupPage: Professional signup attempt started');
          console.warn('📋 ProSignupPage: Basic info:', {
            email: formData.basicInfo.email,
            companyName: formData.basicInfo.companyName,
            siret: formData.basicInfo.siret,
          });
        }

        // Utiliser authService.signUp() pour l'inscription
        const { error: signUpError } = await authService.signUp(
          formData.basicInfo.email,
          formData.basicInfo.password
        );

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ ProSignupPage: Professional signup successful');
        }

        setSuccess(true);
        setTimeout(() => {
          // Redirection sécurisée avec router.push uniquement
          router.push('/auth/login?message=professional_pending');
        }, 3000);
      } catch (error: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ ProSignupPage: Professional signup failed:', error);
        }
        setError(error.message || "Erreur lors de l'inscription");
      } finally {
        setLoading(false);
      }
    },
    [formData, validateStep, setLoading, setError, setSuccess, router]
  );

  return (
    <>
      <SEO
        title="Inscription Professionnel - SwipeTonPro"
        description="Devenez professionnel SwipeTonPro et accédez à des projets qualifiés"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="mr-4">
                  <ArrowLeft className="h-5 w-5 text-gray-600 hover:text-gray-900" />
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">
                  Inscription Professionnel
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      s <= formData.step
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {formData.success ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Inscription envoyée !
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Votre dossier est en cours de validation. Vous recevrez un
                    email dès qu'il sera validé.
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-orange-600">
                    <Clock className="h-4 w-4" />
                    <span>Délai de validation: 24-48h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit}>
              {formData.error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formData.error}</AlertDescription>
                </Alert>
              )}

              {/* Étape 1: Informations de base */}
              {formData.step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de l'entreprise</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email professionnel *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.basicInfo.email}
                          onChange={(e) =>
                            updateBasicInfo('email', e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.basicInfo.phone}
                          onChange={(e) =>
                            updateBasicInfo('phone', e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.basicInfo.password}
                          onChange={(e) =>
                            updateBasicInfo('password', e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Confirmer le mot de passe *
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.basicInfo.confirmPassword}
                          onChange={(e) =>
                            updateBasicInfo('confirmPassword', e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nom de l'entreprise *</Label>
                      <Input
                        id="companyName"
                        value={formData.basicInfo.companyName}
                        onChange={(e) =>
                          updateBasicInfo('companyName', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="siret">Numéro SIRET *</Label>
                      <Input
                        id="siret"
                        value={formData.basicInfo.siret}
                        onChange={(e) =>
                          updateBasicInfo('siret', e.target.value)
                        }
                        placeholder="14 chiffres"
                        maxLength={14}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse *</Label>
                      <Input
                        id="address"
                        value={formData.basicInfo.address}
                        onChange={(e) =>
                          updateBasicInfo('address', e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Code Postal *</Label>
                        <Input
                          id="postalCode"
                          value={formData.basicInfo.postalCode}
                          onChange={(e) =>
                            updateBasicInfo('postalCode', e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ville *</Label>
                        <Input
                          id="city"
                          value={formData.basicInfo.city}
                          onChange={(e) =>
                            updateBasicInfo('city', e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Description de l'entreprise
                      </Label>
                      <Textarea
                        id="description"
                        rows={4}
                        value={formData.basicInfo.description}
                        onChange={(e) =>
                          updateBasicInfo('description', e.target.value)
                        }
                        placeholder="Décrivez votre entreprise, vos spécialités..."
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  onClick={prevStep}
                  disabled={formData.step === 1}
                  variant="outline"
                >
                  Précédent
                </Button>
                {formData.step < 3 ? (
                  <Button type="button" onClick={nextStep}>
                    Suivant
                  </Button>
                ) : (
                  <Button type="submit" disabled={formData.loading}>
                    {formData.loading
                      ? 'Envoi en cours...'
                      : 'Soumettre pour validation'}
                  </Button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
