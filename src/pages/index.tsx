import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Hammer,
  Users,
  Shield,
  Zap,
  Clock,
  Award,
  HardHat,
  Building2,
  Wrench,
  Target,
  TrendingUp,
  CheckCircle2,
  FolderOpen,
  Star,
  MapPin,
  ArrowRight,
  Euro,
  Menu,
  X,
  Crown,
  Sparkles,
  Rocket,
  Lock,
  Heart,
  MessageSquare,
  Search,
  Handshake,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { projectService } from '@/services/projectService';

interface FeaturedProject {
  id: string;
  title: string;
  category: string;
  city: string;
  estimated_budget_min?: number;
  estimated_budget_max?: number;
  created_at: string;
  ai_analysis?: string;
  status: string;
}

export default function Home() {
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>(
    []
  );
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Charger les projets vedettes au montage
  useEffect(() => {
    const loadFeaturedProjects = async () => {
      console.log('🏠 Début chargement projets vedettes...');
      try {
        const { data } = await projectService.getAvailableProjects();
        console.log('🏠 Projets récupérés pour homepage:', data);
        console.log('🏠 Type de données:', typeof data);
        console.log('🏠 Est un array?', Array.isArray(data));

        if (data && Array.isArray(data)) {
          console.log('🏠 Nombre total de projets:', data.length);

          // Filtrer uniquement les projets publiés
          const publishedProjects = data.filter(
            (project) => project.status === 'published'
          );
          console.log('🏠 Projets publiés filtrés:', publishedProjects);
          console.log(
            '🏠 Nombre de projets publiés:',
            publishedProjects.length
          );

          // Prendre les 6 premiers projets publiés comme "vedettes"
          const featured = publishedProjects
            .slice(0, 6)
            .map((project: any) => ({
              id: project.id,
              title: project.title,
              category:
                project.category ||
                (Array.isArray(project.work_type)
                  ? project.work_type[0]
                  : project.work_type) ||
                '',
              city: project.city,
              estimated_budget_min: project.estimated_budget_min,
              estimated_budget_max: project.estimated_budget_max,
              created_at: project.created_at,
              ai_analysis: project.ai_analysis || null,
              status: project.status,
            }));
          console.log('🏠 Projets vedettes mappés:', featured);
          console.log('🏠 Nombre de projets vedettes:', featured.length);
          setFeaturedProjects(featured);
        } else {
          console.log('🏠 Pas de données ou format invalide');
        }
      } catch (error) {
        console.error('🏠 Erreur chargement projets vedettes:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadFeaturedProjects();
  }, []);

  const features = [
    {
      icon: Shield,
      title: 'Sécurité Mutuelle',
      description:
        "Protection totale pour les deux parties avec contrôle d'identité",
      badge: 'Sécurisé',
      color: 'text-orange-600',
    },
    {
      icon: Heart,
      title: 'Match par Intérêt Mutuel',
      description:
        'Le professionnel choisit votre projet, vous choisissez votre pro',
      badge: 'Innovant',
      color: 'text-blue-600',
    },
    {
      icon: Award,
      title: 'Professionnels Certifiés',
      description: 'Artisans experts validés par notre processus de contrôle',
      badge: 'Qualité',
      color: 'text-emerald-600',
    },
    {
      icon: Heart,
      title: 'Dialogue Confiant',
      description: 'Échangez en toute tranquillité avec votre artisan',
      badge: 'Confiance',
      color: 'text-amber-600',
    },
  ];

  const stats = [
    {
      icon: Building2,
      value: '98%',
      label: 'Satisfaction client',
      color: 'text-orange-600',
    },
    {
      icon: HardHat,
      value: '500+',
      label: 'Artisans certifiés',
      color: 'text-emerald-600',
    },
    {
      icon: Award,
      value: '24h',
      label: 'Premier contact',
      color: 'text-blue-600',
    },
    {
      icon: Shield,
      value: '100%',
      label: 'Contrôle qualité',
      color: 'text-amber-600',
    },
  ];

  const process = [
    {
      step: '1',
      icon: Target,
      title: 'Décrivez votre projet',
      description: 'Diagnostic IA personnalisé pour des travaux réussis',
    },
    {
      step: '2',
      icon: Shield,
      title: 'Sélection Sécurisée',
      description: 'Artisans experts choisissent votre projet avec confiance',
    },
    {
      step: '3',
      icon: Heart,
      title: 'Dialogue Confiant',
      description: 'Échangez en toute tranquillité avant de vous engager',
    },
    {
      step: '4',
      icon: Heart,
      title: 'Match Parfait',
      description: "Trouvez l'artisan idéal pour vos travaux",
    },
  ];

  return (
    <>
      <SEO
        title="SwipeTonPro - La Plateforme qui Connecte Artisans BTP et Particuliers"
        description="Trouvez des chantiers qualifiés ou le professionnel parfait pour vos travaux. Matching par intérêt mutuel, paiement sécurisé, satisfaction garantie."
      />

      <div className="min-h-screen bg-gradient-to-br from-background/90 via-muted/40 to-background/90">
        {/* Header with construction grid background */}
        <header className="border-b border-border/40 bg-card/40 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Logo - Left */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <HardHat className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-heading font-black tracking-tight">
                  SwipeTon<span className="text-primary">Pro</span>
                </h1>
              </div>

              {/* Left CTA Buttons - Particulier & Professionnel */}
              <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
                <Link href="/particulier">
                  <Button
                    size="sm"
                    className="text-xs font-semibold px-3 py-1 bg-gradient-to-r from-primary to-primary/90 h-auto"
                  >
                    <Building2 className="mr-1 h-3 w-3" />
                    Particulier
                  </Button>
                </Link>
                <Link href="/professionnel">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-semibold px-3 py-1 h-auto border-primary/50 hover:bg-primary/10"
                  >
                    <Wrench className="mr-1 h-3 w-3" />
                    Professionnel
                  </Button>
                </Link>
              </div>

              {/* Center - Trouver un projet */}
              <div className="hidden lg:flex flex-1 justify-center">
                <Link
                  href="/projets/parcourir"
                  className="text-xs font-semibold text-white bg-gradient-to-r from-primary to-primary/90 flex items-center gap-1 px-4 py-2 rounded-md hover:shadow-lg transition-all hover:scale-105"
                >
                  <FolderOpen className="h-4 w-4" />
                  Trouver un projet
                </Link>
              </div>

              {/* Right Navigation */}
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/fonctionnalites"
                  className="text-xs font-medium hover:text-primary transition-colors"
                >
                  Fonctionnalités
                </Link>
                <Link
                  href="/comment-ca-marche"
                  className="text-xs font-medium hover:text-primary transition-colors"
                >
                  Comment ça marche
                </Link>
                <Link
                  href="/pourquoi-nous"
                  className="text-xs font-medium hover:text-primary transition-colors"
                >
                  Pourquoi nous
                </Link>
                <Link href="/auth/login">
                  <Button className="text-xs h-auto px-3 py-1 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold hover:shadow-lg transition-all">
                    <Users className="mr-1 h-3 w-3" />
                    Connexion
                  </Button>
                </Link>
              </nav>

              {/* Bouton hamburger mobile */}
              <button
                className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Menu mobile déroulant */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur-sm">
              <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
                {/* CTA Particulier / Professionnel */}
                <div className="flex gap-2">
                  <Link
                    href="/particulier"
                    className="flex-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      size="sm"
                      className="w-full text-sm font-semibold bg-gradient-to-r from-primary to-primary/90"
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Particulier
                    </Button>
                  </Link>
                  <Link
                    href="/professionnel"
                    className="flex-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-sm font-semibold border-primary/50"
                    >
                      <Wrench className="mr-2 h-4 w-4" />
                      Professionnel
                    </Button>
                  </Link>
                </div>

                {/* Trouver un projet */}
                <Link
                  href="/projets/parcourir"
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary/90 px-4 py-2 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FolderOpen className="h-4 w-4" />
                  Trouver un projet
                </Link>

                {/* Liens navigation */}
                <div className="flex flex-col gap-1 pt-2 border-t border-border/40">
                  <Link
                    href="/fonctionnalites"
                    className="text-sm font-medium py-2 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Fonctionnalités
                  </Link>
                  <Link
                    href="/comment-ca-marche"
                    className="text-sm font-medium py-2 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Comment ça marche
                  </Link>
                  <Link
                    href="/pourquoi-nous"
                    className="text-sm font-medium py-2 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pourquoi nous
                  </Link>
                </div>

                {/* Connexion */}
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-gradient-to-r from-primary to-primary/90 text-white font-semibold">
                    <Users className="mr-2 h-4 w-4" />
                    Connexion
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* Hero Section with construction theme */}
        <section className="relative overflow-hidden py-12 md:py-16 bg-gradient-to-br from-orange-50 via-white to-amber-50">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-100/30 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto text-center animate-fade-in">
              {/* Badge Premium */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 text-orange-700 font-semibold text-sm mb-6 animate-slide-down">
                <Crown className="h-4 w-4" />
                <span>Première Marketplace par Intérêt Mutuel</span>
                <Sparkles className="h-4 w-4" />
              </div>

              {/* Main Title */}
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black mb-4 tracking-tight animate-slide-up">
                <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 bg-clip-text text-transparent">
                  Reprenez le pouvoir
                </span>
                <br />
                <span className="text-slate-900">
                  <span className="text-orange-700 font-semibold">
                    Choisissez librement
                  </span>
                </span>
              </h2>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-6 leading-relaxed animate-slide-up [animation-delay:200ms]">
                La première plateforme travaux où chacun a le pouvoir de choisir
                librement.
                <br />
                <span className="text-base">
                  Artisans : choisissez les projets qui vous intéressent •
                  Particuliers : choisissez avec qui échanger
                </span>
              </p>

              {/* Benefits */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-10 animate-slide-up [animation-delay:400ms]">
                <div className="flex items-center gap-2 text-orange-700 font-medium bg-orange-50 px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Plus d'appels commerciaux</span>
                </div>
                <div className="flex items-center gap-2 text-blue-700 font-medium bg-blue-50 px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Plus de contacts inutiles</span>
                </div>
                <div className="flex items-center gap-2 text-amber-700 font-medium bg-amber-50 px-4 py-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Plus de perte de temps</span>
                </div>
              </div>

              {/* How it works */}
              <div className="max-w-4xl mx-auto mb-10 animate-slide-up [animation-delay:600ms] bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
                  Comment ça fonctionne
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-600 font-semibold text-sm">
                          1
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          Les particuliers publient
                        </p>
                        <p className="text-sm text-slate-600">
                          Décrivez votre projet gratuitement
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-sm">
                          2
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          Les artisans proposent
                        </p>
                        <p className="text-sm text-slate-600">
                          Seuls les professionnels intéressés postulent
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-600 font-semibold text-sm">
                          3
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          Dialogue limité
                        </p>
                        <p className="text-sm text-slate-600">
                          Quelques messages pour vérifier le match
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-semibold text-sm">
                          4
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          Match mutuel
                        </p>
                        <p className="text-sm text-slate-600">
                          Déblocage des contacts si accord réciproque
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-semibold text-sm">
                          5
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          Paiement séquestré
                        </p>
                        <p className="text-sm text-slate-600">
                          Protection des fonds via notre partenaire de confiance
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-lg font-semibold text-orange-600">
                    Simple. Transparent. Sécurisé.
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    Nous proposons la protection des paiements via notre
                    opérateur partenaire de confiance
                  </p>
                </div>
              </div>

              {/* Enhanced CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10 animate-slide-up [animation-delay:800ms]">
                <Link href="/particulier">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-lg font-semibold px-10 py-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all rounded-full"
                  >
                    <Rocket className="mr-2 h-5 w-5" />
                    Publier mon projet gratuitement
                  </Button>
                </Link>
                <Link href="/professionnel">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-lg font-semibold px-10 py-4 hover:scale-105 transition-all rounded-full"
                  >
                    <Wrench className="mr-2 h-5 w-5" />
                    Trouver des chantiers
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center justify-center gap-8 text-sm text-slate-600 animate-slide-up [animation-delay:1000ms] bg-gray-50 py-4 rounded-xl">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                  <Shield className="w-4 h-4 text-orange-600" />
                  <span className="font-medium">Sécurité Mutuelle</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Contrôle Qualité</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                  <Heart className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Match Confiant</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - Le Pouvoir de Choisir */}
        <section
          id="fonctionnalites"
          className="py-20 bg-gradient-to-br from-gray-50 to-white"
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="text-4xl lg:text-5xl font-black mb-6 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Le Pouvoir de Choisir
              </h3>
              <p className="text-xl text-slate-600 mb-4">
                Une mise en relation simple et équitable
              </p>
              <p className="text-lg text-slate-500 max-w-3xl mx-auto">
                Contrairement aux plateformes classiques, SwipeTonPro ne force
                personne.
                <br />
                Chaque partie garde le contrôle total du processus.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-16 max-w-7xl mx-auto">
              {/* Pour les particuliers */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-orange-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-orange-600">
                    Pour les particuliers
                  </h4>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-black">1</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg mb-2">
                        Publiez votre projet gratuitement
                      </h5>
                      <p className="text-slate-600 mb-2">
                        Expliquez votre besoin en quelques minutes.
                      </p>
                      <p className="text-slate-500 text-sm italic">
                        Notre IA vous donne la situation de votre budget :<br />
                        Estimer du budget{' '}
                        <span className="text-xs">
                          (estimation en moyenne haute et ne peut etre pris pour
                          base)
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-black">2</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg mb-2">
                        Recevez les candidatures d'artisans
                      </h5>
                      <p className="text-slate-600">
                        Les professionnels intéressés par votre projet vous
                        contactent.
                        <br />
                        Vous choisissez avec qui discuter.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-black">3</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg mb-2">
                        Décidez librement
                      </h5>
                      <p className="text-slate-600">
                        Si l'artisan vous inspire :<br />
                        <strong>vous matchez.</strong>
                        <br />
                        Vous pouvez alors continuer votre projet sereinement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pour les artisans */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HardHat className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-blue-600">
                    Pour les artisans
                  </h4>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-black">1</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg mb-2">
                        Accédez à des projets qualifiés
                      </h5>
                      <p className="text-slate-600">
                        Consultez des demandes de travaux réelles près de chez
                        vous.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-black">2</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg mb-2">
                        Échangez avant tout paiement
                      </h5>
                      <p className="text-slate-600">
                        Discutez avec le particulier pour vérifier :
                      </p>
                      <ul className="text-slate-600 ml-4 mt-2">
                        <li>• la pertinence du projet</li>
                        <li>• spécificité materiel ou logistique</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-black">3</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-lg mb-2">
                        Débloquez le contact si le projet vous intéresse
                      </h5>
                      <p className="text-slate-600">
                        Si le particulier souhaite également continuer :<br />
                        <strong>Match mutuel.</strong>
                        <br />
                        Vous décidez alors de débloquer les coordonnées.
                        <br />
                        <em>
                          Vous ne payez que lorsque le projet vous intéresse
                          réellement.
                        </em>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Projects Section - AGRANDI */}
        <section className="py-6 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-4">
                <h3 className="text-xl md:text-2xl font-heading font-black mb-2">
                  Projets <span className="text-primary">Récents</span>
                </h3>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  Découvrez les derniers projets publiés par les particuliers
                </p>
              </div>

              {loadingProjects ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <Card
                      key={index}
                      className="border-border/50 hover:shadow-lg transition-all hover:scale-105 border-2 border-primary/20"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-2 bg-muted rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : featuredProjects.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredProjects.map((project) => (
                    <Card
                      key={project.id}
                      className="hover:shadow-lg transition-all hover:scale-105 border-2 border-primary/20 bg-card/90"
                    >
                      <CardContent className="p-4">
                        {/* Badge de statut */}
                        <div className="flex items-center justify-between mb-3">
                          <Badge
                            className={
                              project.status === 'published'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {project.status === 'published'
                              ? 'Validé'
                              : 'En attente'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {project.category}
                          </Badge>
                        </div>

                        {/* Titre du projet */}
                        <h4 className="font-bold text-base mb-2 line-clamp-2">
                          {project.title}
                        </h4>

                        {/* Localisation et budget */}
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span>{project.city}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Euro className="w-3 h-3" />
                            <span>
                              {project.estimated_budget_min &&
                              project.estimated_budget_max
                                ? `${project.estimated_budget_min.toLocaleString()} € - ${project.estimated_budget_max.toLocaleString()} €`
                                : project.estimated_budget_max
                                  ? `${project.estimated_budget_max.toLocaleString()} €`
                                  : project.estimated_budget_min
                                    ? `À partir de ${project.estimated_budget_min.toLocaleString()} €`
                                    : 'Budget à définir'}
                            </span>
                          </div>
                          {project.ai_analysis && (
                            <div className="pt-1 border-t border-border/50">
                              <p className="text-xs text-text-secondary font-medium mb-1">
                                🤖 Estimation IA
                              </p>
                              <div className="text-xs text-text-secondary space-y-1">
                                {typeof project.ai_analysis === 'object' ? (
                                  <>
                                    {(project.ai_analysis as any)
                                      ?.estimated_cost && (
                                      <p>
                                        Coût estimé:{' '}
                                        {
                                          (project.ai_analysis as any)
                                            .estimated_cost
                                        }
                                        €
                                      </p>
                                    )}
                                    {(project.ai_analysis as any)
                                      ?.duration_days && (
                                      <p>
                                        Durée:{' '}
                                        {
                                          (project.ai_analysis as any)
                                            .duration_days
                                        }{' '}
                                        jours
                                      </p>
                                    )}
                                    {(project.ai_analysis as any)
                                      ?.complexity && (
                                      <p>
                                        Complexité:{' '}
                                        {
                                          (project.ai_analysis as any)
                                            .complexity
                                        }
                                      </p>
                                    )}
                                    {(project.ai_analysis as any)
                                      ?.recommended_professions && (
                                      <p>
                                        Professions:{' '}
                                        {Array.isArray(
                                          (project.ai_analysis as any)
                                            .recommended_professions
                                        )
                                          ? (
                                              project.ai_analysis as any
                                            ).recommended_professions.join(', ')
                                          : (project.ai_analysis as any)
                                              .recommended_professions}
                                      </p>
                                    )}
                                    {(project.ai_analysis as any)
                                      ?.materials_needed && (
                                      <p>
                                        Matériaux:{' '}
                                        {Array.isArray(
                                          (project.ai_analysis as any)
                                            .materials_needed
                                        )
                                          ? (
                                              project.ai_analysis as any
                                            ).materials_needed.join(', ')
                                          : (project.ai_analysis as any)
                                              .materials_needed}
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <p className="whitespace-pre-wrap">
                                    {project.ai_analysis}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-text-muted italic mt-1">
                                * À titre indicatif, ne peut être prise pour
                                valeur contractuelle
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Bouton action */}
                        <div className="mt-3">
                          <Link href={`/projets/${project.id}`}>
                            <Button size="sm" className="w-full text-xs">
                              Voir les détails
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    Aucun projet disponible
                  </h3>
                  <p className="text-muted-foreground">
                    Revenez plus tard pour découvrir de nouveaux projets
                  </p>
                </div>
              )}

              {/* Bouton voir tous les projets */}
              <div className="text-center mt-12">
                <Link href="/projets/parcourir">
                  <Button variant="outline" size="lg">
                    Voir tous les projets
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-white/15 to-transparent" />

          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-4xl lg:text-5xl font-black mb-6">
                Trouvez le bon artisan ou votre prochain chantier
              </h3>
              <p className="text-xl mb-12 opacity-90">
                SwipeTonPro simplifie la rencontre entre particuliers et
                professionnels
                <br />
                dans un environnement libre, sécurisé et transparent
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/particulier">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="bg-white text-blue-600 hover:bg-gray-100 text-xl font-bold px-12 py-6 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
                  >
                    <Rocket className="mr-3 h-6 w-6" />
                    Publier mon projet gratuitement
                  </Button>
                </Link>
                <Link href="/professionnel">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-xl font-bold px-12 py-6 hover:scale-105 transition-all"
                  >
                    <Wrench className="mr-3 h-6 w-6" />
                    Découvrir les chantiers
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-card border-t border-border py-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <HardHat className="h-5 w-5 text-primary" />
                <span className="font-heading font-bold text-sm">
                  SwipeTonPro 2.0
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                © 2026 SwipeTonPro. Tous droits réservés.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="#"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Mentions légales
                </Link>
                <Link
                  href="#"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Confidentialité
                </Link>
                <Link
                  href="#"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  CGU
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
