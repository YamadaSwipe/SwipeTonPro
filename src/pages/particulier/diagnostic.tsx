import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Upload,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Award,
  Calendar,
  Euro,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { projectService } from '@/services/projectService';
import {
  generateEstimationWithFallback,
  type AIEstimation,
} from '@/services/aiEstimationService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAISettings } from '@/services/platformService';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { notificationService } from '@/services/notificationService';
import { supabase } from '@/integrations/supabase/client';

type DiagnosticStep =
  | 'contact'
  | 'project'
  | 'photos'
  | 'estimation'
  | 'validation';

interface ProjectData {
  // Informations contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;

  // Informations projet
  description: string;
  workType: string;
  location: string;
  surface?: number;
  budgetMin: number;
  budgetMax: number;
  deadline: string;

  // Certifications requises
  requiredCertifications: string[];

  // Photos
  photos: File[];

  // Estimation IA
  aiEstimation: AIEstimation | null;
  estimationError?: string;
}

import { WORK_TYPES } from '@/lib/constants/work-types';

const CERTIFICATIONS = [
  {
    id: 'qualibat',
    label: 'Qualibat',
    description: 'Certification qualité BTP',
  },
  { id: 'rge', label: 'RGE', description: 'Reconnu Garant Environnement' },
  {
    id: 'ecoArtisan',
    label: 'Eco Artisan',
    description: 'Rénovation énergétique',
  },
  {
    id: 'qualitEnr',
    label: "Qualit'EnR",
    description: 'Énergies renouvelables',
  },
  {
    id: 'qualiPV',
    label: 'QualiPV',
    description: 'Panneaux solaires photovoltaïques',
  },
  { id: 'qualiPAC', label: 'QualiPAC', description: 'Pompe à chaleur' },
  { id: 'qualiBois', label: 'Qualibois', description: 'Chauffage bois' },
];

const DEADLINE_OPTIONS = [
  "Moins d'1 mois",
  '1 à 3 mois',
  '3 à 6 mois',
  '6 mois à 1 an',
  "Plus d'1 an",
  'Pas de contrainte',
];

export default function DiagnosticPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<DiagnosticStep>('contact');
  const [projectData, setProjectData] = useState<ProjectData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    description: '',
    workType: '',
    location: '',
    surface: 0,
    budgetMin: 0,
    budgetMax: 0,
    deadline: '',
    requiredCertifications: [],
    photos: [],
    aiEstimation: null,
  });
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSettings, setAiSettings] = useState<{
    enabled: boolean;
    mode: string;
    creditsRemaining: number;
  } | null>(null);

  // Charger les paramètres IA et vérifier l'authentification au montage
  useEffect(() => {
    async function initializeDiagnostic() {
      // Vérifier si l'utilisateur est connecté
      const session = await authService.getCurrentSession();
      if (!session || !session.user) {
        // Rediriger vers la page de création de compte si non connecté
        router.push('/particulier/create-account?redirect=diagnostic');
        return;
      }

      // Charger les paramètres IA
      const settings = await getAISettings();
      setAiSettings(settings);

      // Pré-remplir les infos utilisateur si disponibles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, phone, city, postal_code')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        const names = profile.full_name?.split(' ') || ['', ''];
        setProjectData((prev) => ({
          ...prev,
          firstName: names[0] || '',
          lastName: names[1] || '',
          email: profile.email || '',
          phone: profile.phone || '',
          city: profile.city || '',
          postal_code: profile.postal_code || '',
        }));
      }
    }

    initializeDiagnostic();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Passer à l'étape suivante
    handleNext();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setProjectData({
        ...projectData,
        photos: [...projectData.photos, ...files],
      });
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = projectData.photos.filter((_, i) => i !== index);
    setProjectData({ ...projectData, photos: newPhotos });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProjectData((prevData) => ({ ...prevData, [id]: value }));
  };

  const toggleCertification = (certId: string) => {
    const current = projectData.requiredCertifications;
    if (current.includes(certId)) {
      setProjectData({
        ...projectData,
        requiredCertifications: current.filter((c) => c !== certId),
      });
    } else {
      setProjectData({
        ...projectData,
        requiredCertifications: [...current, certId],
      });
    }
  };

  const generateAIEstimation = async () => {
    setIsProcessing(true);

    try {
      const result = await generateEstimationWithFallback({
        description: projectData.description,
        surface: projectData.surface,
        ville: projectData.location,
        type_bien: projectData.workType,
        mode: aiSettings?.mode as 'text_only' | 'photo_only' | 'text_and_photo',
      });

      if (result.success && result.estimation) {
        setProjectData({
          ...projectData,
          aiEstimation: result.estimation,
          estimationError: result.error,
        });
        setCurrentStep('estimation');
      } else {
        setProjectData({
          ...projectData,
          aiEstimation: result.estimation || null,
          estimationError: result.error,
        });
        setCurrentStep('estimation');
      }
    } catch (error) {
      console.error('Error generating estimation:', error);
      setProjectData({
        ...projectData,
        estimationError: "Erreur lors de la génération de l'estimation",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 'contact') {
      if (
        projectData.firstName &&
        projectData.lastName &&
        projectData.email &&
        projectData.phone
      ) {
        // Vérifier si l'utilisateur est connecté à la fin de l'étape 1
        const session = await authService.getCurrentSession();
        if (!session?.user) {
          // Pas connecté, rediriger vers la création de compte
          console.log(
            '⚠️ Utilisateur non connecté, redirection vers création de compte'
          );
          window.location.href = '/particulier/create-account';
          return;
        }

        // Utilisateur connecté, continuer à l'étape 2
        setCurrentStep('project');
      }
    } else if (currentStep === 'project') {
      if (
        projectData.description &&
        projectData.workType &&
        projectData.budgetMin &&
        projectData.budgetMax &&
        projectData.deadline
      ) {
        // Vérifier le mode IA
        const mode = aiSettings?.mode || 'text_and_photo';

        if (mode === 'text_only' || !aiSettings?.enabled) {
          // Passer directement à l'estimation sans photos
          generateAIEstimation();
        } else if (mode === 'photo_only') {
          // Photos obligatoires
          setCurrentStep('photos');
        } else {
          // Mode mixte - Photos optionnelles
          setCurrentStep('photos');
        }
      }
    } else if (currentStep === 'photos') {
      generateAIEstimation();
    }
  };

  const handleSkipPhotos = () => {
    generateAIEstimation();
  };

  const handleValidateBudget = () => {
    if (
      projectData.budgetMax >= (projectData.aiEstimation?.estimation_min || 0)
    ) {
      setCurrentStep('validation');
    }
  };

  const handlePublishProject = async () => {
    setIsProcessing(true);
    try {
      // Récupérer l'utilisateur connecté (devrait toujours être connecté à cette étape)
      const session = await authService.getCurrentSession();
      const user = session?.user;

      if (!user) {
        throw new Error('Vous devez être connecté pour publier un projet');
      }

      console.log("📦 Publication du projet pour l'utilisateur:", user.id);

      // Créer le projet avec le statut "pending_validation"
      const projectToCreate = {
        title: `${projectData.workType} - ${projectData.city}`,
        description: projectData.description,
        budget_min: projectData.budgetMin,
        budget_max: projectData.budgetMax,
        location: projectData.address,
        city: projectData.city,
        postal_code: projectData.postal_code,
        work_type: projectData.workType,
        deadline: projectData.deadline,
        required_certifications: projectData.requiredCertifications,
        ai_estimation: projectData.aiEstimation,
        status: 'pending_validation',
      };

      // Créer le projet
      const newProject = await projectService.createProject(projectToCreate);

      if (!newProject || !newProject.id) {
        throw new Error('Impossible de créer le projet');
      }

      // Uploader les images si présentes
      if (projectData.photos.length > 0) {
        try {
          const { data: uploadedUrls, error: uploadError } =
            await projectService.uploadProjectImages(
              newProject.id,
              projectData.photos
            );
          if (uploadError) console.error('Erreur upload images:', uploadError);
        } catch (uploadError) {
          console.error(
            'Erreur lors du téléchargement des images:',
            uploadError
          );
          // Continuer même si upload échoue
        }
      }

      console.log('✅ Projet créé avec succès:', newProject.id);

      // Envoyer les notifications
      const notificationSession = await authService.getCurrentSession();
      if (notificationSession?.user) {
        // Notifier les admins
        await notificationService.notifyNewProject(newProject);

        // Envoyer le récapitulatif au client
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', notificationSession.user.id)
          .single();

        if (profile) {
          await notificationService.sendProjectRecap(
            newProject,
            profile as any
          );
        }
      }

      // Afficher un message de succès
      alert(
        '✅ Projet publié avec succès!\n\nVotre projet est maintenant en attente de validation par nos modérateurs.\nVous recevrez un email de confirmation sur votre adresse: ' +
          (notificationSession?.user?.email || projectData.email)
      );

      // Rediriger vers le dashboard après 2s
      setTimeout(() => {
        window.location.href = `/particulier/dashboard?newProjectId=${newProject.id}&status=pending_validation`;
      }, 2000);
    } catch (error) {
      console.error('❌ Erreur lors de la création du projet:', error);
      alert(
        `Erreur: ${error instanceof Error ? error.message : 'Une erreur est survenue'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const stepProgress = {
    contact: 20,
    project: 40,
    photos: 60,
    estimation: 80,
    validation: 100,
  };

  const getStepNumber = () => {
    const steps = ['contact', 'project', 'photos', 'estimation', 'validation'];
    return steps.indexOf(currentStep) + 1;
  };

  return (
    <>
      <SEO
        title="Diagnostic de projet - SwipeTonPro 2.0"
        description="Décrivez votre projet BTP et obtenez une estimation IA personnalisée"
      />

      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface">
        {/* Header */}
        <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/particulier"
                className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Retour</span>
              </Link>
              <div className="font-mono text-sm font-semibold text-primary">
                Étape {getStepNumber()}/5
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 w-full bg-border rounded-full h-2 overflow-hidden">
              <div
                className="h-full gradient-primary transition-all duration-500"
                style={{ width: `${stepProgress[currentStep]}%` }}
              ></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Step 1: Contact Information */}
          {currentStep === 'contact' && (
            <Card className="border-2 animate-fade-in">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Vos coordonnées</h2>
                    <p className="text-text-secondary">
                      Pour que les professionnels puissent vous contacter
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={projectData.firstName}
                      onChange={handleInputChange}
                      required
                    />

                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={projectData.lastName}
                      onChange={handleInputChange}
                      required
                    />

                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={projectData.city}
                      onChange={handleInputChange}
                      required
                    />

                    <Label htmlFor="postal_code">Code Postal</Label>
                    <Input
                      id="postal_code"
                      value={projectData.postal_code}
                      onChange={handleInputChange}
                      required
                    />

                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={projectData.email}
                      onChange={handleInputChange}
                      required
                    />

                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={projectData.phone}
                      onChange={handleInputChange}
                      required
                    />

                    <Button type="submit" disabled={loading}>
                      {loading ? 'En cours...' : 'Soumettre'}
                    </Button>
                  </form>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      🔒 <strong>Confidentialité garantie</strong>
                      <br />
                      Vos coordonnées restent masquées jusqu'à validation
                      mutuelle (système Double-Aveugle).
                    </AlertDescription>
                  </Alert>

                  <Button
                    size="lg"
                    onClick={handleNext}
                    disabled={
                      !projectData.firstName ||
                      !projectData.lastName ||
                      !projectData.email ||
                      !projectData.phone ||
                      !projectData.address
                    }
                    className="w-full gradient-primary text-white font-semibold py-6"
                  >
                    Continuer vers le projet
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Project Details */}
          {currentStep === 'project' && (
            <Card className="border-2 animate-fade-in">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Détails du projet</h2>
                    <p className="text-text-secondary">
                      Décrivez précisément vos besoins
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label
                      htmlFor="workType"
                      className="text-sm font-semibold mb-2"
                    >
                      Type de travaux *
                    </Label>
                    <select
                      id="workType"
                      value={projectData.workType}
                      onChange={(e) =>
                        setProjectData({
                          ...projectData,
                          workType: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="">Sélectionnez...</option>
                      {WORK_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label
                      htmlFor="location"
                      className="text-sm font-semibold mb-2"
                    >
                      Localisation (Ville) *
                    </Label>
                    <Input
                      id="location"
                      placeholder="ex: Paris, Lyon, Marseille..."
                      value={projectData.location}
                      onChange={(e) =>
                        setProjectData({
                          ...projectData,
                          location: e.target.value,
                        })
                      }
                      className="border-2"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="surface"
                      className="text-sm font-semibold mb-2"
                    >
                      Surface (m²) - Optionnel
                    </Label>
                    <Input
                      id="surface"
                      type="number"
                      placeholder="ex: 70"
                      value={projectData.surface || ''}
                      onChange={(e) =>
                        setProjectData({
                          ...projectData,
                          surface: Number(e.target.value) || undefined,
                        })
                      }
                      className="border-2"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="description"
                      className="text-sm font-semibold mb-2"
                    >
                      Description détaillée *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez en détail votre projet : état actuel, résultat souhaité, contraintes particulières, marques souhaitées (ex: Daikin pour climatisation, Velux pour fenêtres)..."
                      value={projectData.description}
                      onChange={(e) =>
                        setProjectData({
                          ...projectData,
                          description: e.target.value,
                        })
                      }
                      rows={6}
                      className="border-2"
                    />
                    <p className="text-sm text-text-muted mt-2">
                      💡{' '}
                      <strong>
                        Plus votre description est précise, meilleure sera
                        l'estimation.
                      </strong>
                      <br />
                      N'hésitez pas à mentionner les marques souhaitées (ex:
                      Bosch, Atlantic, Vaillant) - cette information aide l'IA
                      et permet aux professionnels de mieux se projeter.
                    </p>
                  </div>

                  {/* Budget */}
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Euro className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Budget envisagé</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="budgetMin"
                          className="text-sm font-semibold mb-2"
                        >
                          Budget minimum (€) *
                        </Label>
                        <Input
                          id="budgetMin"
                          type="number"
                          placeholder="5000"
                          value={projectData.budgetMin || ''}
                          onChange={(e) =>
                            setProjectData({
                              ...projectData,
                              budgetMin: Number(e.target.value),
                            })
                          }
                          className="border-2"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="budgetMax"
                          className="text-sm font-semibold mb-2"
                        >
                          Budget maximum (€) *
                        </Label>
                        <Input
                          id="budgetMax"
                          type="number"
                          placeholder="15000"
                          value={projectData.budgetMax || ''}
                          onChange={(e) =>
                            setProjectData({
                              ...projectData,
                              budgetMax: Number(e.target.value),
                            })
                          }
                          className="border-2"
                        />
                      </div>
                    </div>
                    {projectData.budgetMax > 0 &&
                      projectData.budgetMin > projectData.budgetMax && (
                        <p className="text-sm text-warning mt-2">
                          ⚠️ Le budget maximum doit être supérieur au minimum
                        </p>
                      )}
                  </div>

                  {/* Deadline */}
                  <div>
                    <Label
                      htmlFor="deadline"
                      className="text-sm font-semibold mb-2 flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Délai souhaité *
                    </Label>
                    <select
                      id="deadline"
                      value={projectData.deadline}
                      onChange={(e) =>
                        setProjectData({
                          ...projectData,
                          deadline: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="">Sélectionnez un délai...</option>
                      {DEADLINE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Certifications */}
                  <div className="bg-gradient-to-br from-success/5 to-success/10 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-5 h-5 text-success" />
                      <h3 className="font-semibold">
                        Certifications requises (optionnel)
                      </h3>
                    </div>
                    <p className="text-sm text-text-secondary mb-4">
                      Sélectionnez les certifications que le professionnel doit
                      posséder.
                      <br />
                      Les pros sans ces certifications ne verront pas votre
                      projet.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CERTIFICATIONS.map((cert) => (
                        <div
                          key={cert.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors"
                        >
                          <Checkbox
                            id={cert.id}
                            checked={projectData.requiredCertifications.includes(
                              cert.id
                            )}
                            onCheckedChange={() => toggleCertification(cert.id)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={cert.id}
                              className="font-semibold cursor-pointer"
                            >
                              {cert.label}
                            </Label>
                            <p className="text-xs text-text-muted">
                              {cert.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {projectData.requiredCertifications.length > 0 && (
                      <Alert className="mt-4">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <AlertDescription>
                          ✅ {projectData.requiredCertifications.length}{' '}
                          certification(s) sélectionnée(s). Seuls les pros
                          certifiés verront votre projet.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('contact')}
                      className="flex-1"
                    >
                      Retour
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleNext}
                      disabled={
                        !projectData.description ||
                        !projectData.workType ||
                        !projectData.location ||
                        !projectData.budgetMin ||
                        !projectData.budgetMax ||
                        projectData.budgetMin > projectData.budgetMax ||
                        !projectData.deadline
                      }
                      className="flex-1 gradient-primary text-white font-semibold"
                    >
                      {aiSettings?.mode === 'text_only' || !aiSettings?.enabled
                        ? "Générer l'estimation"
                        : 'Ajouter des photos (optionnel)'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Photos (Optional) */}
          {currentStep === 'photos' && (
            <Card className="border-2 animate-fade-in">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Photos de la zone de travaux
                    </h2>
                    <p className="text-text-secondary">
                      Optionnel - Aide l'IA à affiner son estimation
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Upload Zone */}
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
                      <p className="font-semibold mb-2">
                        Cliquez pour ajouter des photos
                      </p>
                      <p className="text-sm text-text-secondary">
                        Format: JPG, PNG - Maximum 10 photos
                      </p>
                    </label>
                  </div>

                  {/* Photos Preview */}
                  {projectData.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {projectData.photos.map((file, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border-2 border-success group"
                        >
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Photo ${index + 1}`}
                            width={500}
                            height={300}
                          />
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-semibold"
                          >
                            Supprimer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      <strong>💡 Astuce pour une meilleure estimation</strong>
                      <p className="text-sm mt-1">
                        Prenez des photos de l'ensemble de la pièce/zone,
                        incluant les détails importants (murs, sol, plafond).
                      </p>
                    </AlertDescription>
                  </Alert>

                  {aiSettings && !aiSettings.enabled && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        ⚠️ L'estimation IA est actuellement désactivée.
                        L'estimation sera générée avec nos barèmes
                        professionnels.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep('project')}
                      className="flex-1"
                    >
                      Retour
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSkipPhotos}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      Passer cette étape
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleNext}
                      disabled={isProcessing}
                      className="flex-1 gradient-primary text-white font-semibold"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyse IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Générer l'estimation
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Estimation */}
          {currentStep === 'estimation' && (
            <Card className="border-2 animate-fade-in">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  {isProcessing ? (
                    <>
                      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <h2 className="text-2xl font-bold mb-2">
                        Analyse en cours...
                      </h2>
                      <p className="text-text-secondary">
                        {aiSettings?.enabled
                          ? 'GPT-4 analyse votre projet'
                          : 'Calcul avec nos barèmes professionnels'}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-success" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">
                        Estimation générée
                      </h2>
                      <p className="text-text-secondary">
                        {projectData.estimationError
                          ? 'Estimation basée sur nos barèmes'
                          : 'Analyse complète'}
                      </p>
                    </>
                  )}
                </div>

                {!isProcessing && projectData.aiEstimation && (
                  <div className="space-y-6">
                    {projectData.estimationError && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {projectData.estimationError}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Estimation Range */}
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 text-center">
                      <p className="text-sm font-semibold text-text-secondary mb-2">
                        Fourchette recommandée
                      </p>
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <div>
                          <p className="text-3xl font-bold text-primary">
                            {projectData.aiEstimation.estimation_min.toLocaleString()}
                            €
                          </p>
                          <p className="text-xs text-text-muted">
                            Estimation basse
                          </p>
                        </div>
                        <div className="text-2xl text-text-muted">—</div>
                        <div>
                          <p className="text-3xl font-bold text-accent">
                            {projectData.aiEstimation.estimation_max.toLocaleString()}
                            €
                          </p>
                          <p className="text-xs text-text-muted">
                            Estimation haute
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-white/50 font-semibold">
                          Complexité: {projectData.aiEstimation.complexite}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/50 font-semibold">
                          Durée: {projectData.aiEstimation.duree_jours} jours
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/50 font-semibold">
                          Confiance: {projectData.aiEstimation.confidence_score}
                          %
                        </span>
                      </div>
                    </div>

                    {/* Legal Disclaimer */}
                    <Alert
                      variant="default"
                      className="bg-slate-50 border-slate-200"
                    >
                      <AlertCircle className="h-4 w-4 text-slate-500" />
                      <AlertDescription className="text-xs text-slate-600">
                        <strong>À titre indicatif uniquement</strong> — Cette
                        estimation est fournie à titre d'information et ne
                        constitue pas une base de négociation. Le prix final des
                        travaux sera établi librement entre vous et les artisans
                        sur la base de leurs devis détaillés.
                      </AlertDescription>
                    </Alert>

                    {/* Budget Comparison */}
                    {projectData.budgetMax > 0 && (
                      <Alert
                        variant={
                          projectData.budgetMax <
                          projectData.aiEstimation.estimation_min
                            ? 'destructive'
                            : projectData.budgetMin >
                                projectData.aiEstimation.estimation_max
                              ? 'destructive'
                              : 'default'
                        }
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {projectData.budgetMax <
                          projectData.aiEstimation.estimation_min ? (
                            <p>
                              ⚠️ <strong>Budget insuffisant</strong> - Votre
                              budget maximum (
                              {projectData.budgetMax.toLocaleString()}€) est
                              inférieur à l'estimation basse. Vous risquez de ne
                              pas recevoir de propositions.
                            </p>
                          ) : projectData.budgetMin >
                            projectData.aiEstimation.estimation_max ? (
                            <p>
                              💰 <strong>Budget généreux</strong> - Votre budget
                              minimum ({projectData.budgetMin.toLocaleString()}
                              €) dépasse l'estimation haute. Vous devriez
                              recevoir beaucoup de propositions de qualité.
                            </p>
                          ) : (
                            <p>
                              ✅ <strong>Budget cohérent</strong> - Votre budget
                              ({projectData.budgetMin.toLocaleString()}€ -{' '}
                              {projectData.budgetMax.toLocaleString()}€)
                              correspond bien à l'estimation.
                            </p>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Categories Breakdown */}
                    {projectData.aiEstimation.categories.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Détail par catégorie</h4>
                        {projectData.aiEstimation.categories.map(
                          (cat, index) => (
                            <div
                              key={index}
                              className="bg-surface-elevated rounded-lg p-4"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">{cat.nom}</span>
                                <span className="text-primary font-bold">
                                  {cat.min.toLocaleString()}€ -{' '}
                                  {cat.max.toLocaleString()}€
                                </span>
                              </div>
                              {cat.details && (
                                <p className="text-sm text-text-secondary">
                                  {cat.details}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Risks */}
                    {projectData.aiEstimation.risques.length > 0 && (
                      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-warning" />
                          Risques identifiés
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {projectData.aiEstimation.risques.map(
                            (risk, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <span className="text-warning">•</span>
                                <span>{risk}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {projectData.aiEstimation.conseils.length > 0 && (
                      <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-success" />
                          Conseils
                        </h4>
                        <ul className="space-y-1 text-sm">
                          {projectData.aiEstimation.conseils.map(
                            (conseil, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <span className="text-success">•</span>
                                <span>{conseil}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('photos')}
                        className="flex-1"
                      >
                        Retour
                      </Button>
                      <Button
                        size="lg"
                        onClick={handleValidateBudget}
                        className="flex-1 gradient-primary text-white font-semibold"
                      >
                        Publier mon projet
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Validation */}
          {currentStep === 'validation' && (
            <Card className="border-2 border-success animate-fade-in">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-success" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Projet validé !</h2>
                  <p className="text-text-secondary">
                    Votre projet va être publié sur le flux des professionnels
                    certifiés
                  </p>
                </div>

                {/* Recap */}
                <div className="space-y-4 mb-8">
                  <div className="bg-surface-elevated rounded-lg p-4">
                    <p className="text-sm text-text-muted mb-1">Contact</p>
                    <p className="font-semibold">
                      {projectData.firstName} {projectData.lastName}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {projectData.email} • {projectData.phone}
                    </p>
                  </div>

                  <div className="bg-surface-elevated rounded-lg p-4">
                    <p className="text-sm text-text-muted mb-1">
                      Adresse du chantier
                    </p>
                    <p className="font-semibold">{projectData.address}</p>
                  </div>

                  <div className="bg-surface-elevated rounded-lg p-4">
                    <p className="text-sm text-text-muted mb-1">
                      Type de travaux
                    </p>
                    <p className="font-semibold">{projectData.workType}</p>
                  </div>

                  <div className="bg-surface-elevated rounded-lg p-4">
                    <p className="text-sm text-text-muted mb-1">Budget</p>
                    <p className="font-semibold text-2xl text-primary">
                      {projectData.budgetMin.toLocaleString()}€ -{' '}
                      {projectData.budgetMax.toLocaleString()}€
                    </p>
                  </div>

                  <div className="bg-surface-elevated rounded-lg p-4">
                    <p className="text-sm text-text-muted mb-1">
                      Délai souhaité
                    </p>
                    <p className="font-semibold">{projectData.deadline}</p>
                  </div>

                  {projectData.requiredCertifications.length > 0 && (
                    <div className="bg-surface-elevated rounded-lg p-4">
                      <p className="text-sm text-text-muted mb-1">
                        Certifications requises
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {projectData.requiredCertifications.map((certId) => {
                          const cert = CERTIFICATIONS.find(
                            (c) => c.id === certId
                          );
                          return (
                            <span
                              key={certId}
                              className="px-3 py-1 rounded-full bg-success/10 text-success font-semibold text-sm"
                            >
                              {cert?.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="bg-surface-elevated rounded-lg p-4">
                    <p className="text-sm text-text-muted mb-1">
                      Photos uploadées
                    </p>
                    <p className="font-semibold">
                      {projectData.photos.length} photo
                      {projectData.photos.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  {projectData.aiEstimation && (
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-4">
                      <p className="text-sm text-text-muted mb-1">
                        Estimation{' '}
                        {aiSettings?.enabled ? 'IA' : 'professionnelle'}
                      </p>
                      <p className="font-semibold text-lg">
                        {projectData.aiEstimation.estimation_min.toLocaleString()}
                        € -{' '}
                        {projectData.aiEstimation.estimation_max.toLocaleString()}
                        €
                      </p>
                      <p className="text-sm text-text-secondary mt-1">
                        Complexité: {projectData.aiEstimation.complexite} •
                        Durée: {projectData.aiEstimation.duree_jours}j •
                        Confiance: {projectData.aiEstimation.confidence_score}%
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold mb-3">
                    🔒 Protection Double-Aveugle activée
                  </h4>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span>
                        Vos coordonnées restent masquées jusqu'à validation
                        mutuelle
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span>
                        Vous recevrez les portfolios anonymisés des pros
                        intéressés
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span>
                        {projectData.requiredCertifications.length > 0
                          ? `Seuls les pros avec les certifications requises verront votre projet`
                          : `Tous les pros qualifiés verront votre projet`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <span>
                        Aucun contact direct possible sans votre accord
                      </span>
                    </li>
                  </ul>
                </div>

                <Button
                  size="lg"
                  className="w-full gradient-primary text-white font-semibold py-6"
                  onClick={handlePublishProject}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Publication en cours...
                    </>
                  ) : (
                    'Publier et créer mon compte'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </>
  );
}
