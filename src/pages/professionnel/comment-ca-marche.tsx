import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  Target,
  MessageSquare,
  CheckCircle,
  Users,
  Shield,
  Clock,
  Star,
  Zap,
  Award,
  Phone,
  Calendar,
  MapPin,
  Hammer,
  Euro,
  TrendingUp,
} from 'lucide-react';

export default function ProfessionnelsCommentCaMarchePage() {
  const steps = [
    {
      step: '1',
      icon: Target,
      title: 'Créez Votre Compte Pro',
      description:
        'Inscription gratuite en 2 minutes. Vérification professionnelle instantanée.',
      details: [
        'Email et mot de passe sécurisés',
        'Vérification certifications (SIRET, assurances)',
        "Profil complet avec compétences et zone d'intervention",
        'Badge de confiance selon vérifications',
      ],
      user: 'Professionnel',
      duration: '2 minutes',
    },
    {
      step: '2',
      icon: Users,
      title: 'Parcourez les Projets',
      description:
        'Trouvez les projets qui correspondent à vos compétences et votre zone géographique.',
      details: [
        "Filtrage par localisation et rayon d'intervention",
        'Filtrage par type de travaux et budget',
        'Alertes nouveaux projets correspondants',
        'Maximum 3 pros par projet = moins de concurrence',
      ],
      user: 'Professionnel',
      duration: 'Illimité',
    },
    {
      step: '3',
      icon: MessageSquare,
      title: 'Qualifiez le Projet',
      description:
        'Communiquez gratuitement avec le client pour qualifier les besoins sans engagement.',
      details: [
        'Messagerie intégrée et sécurisée',
        'Partage de photos et documents techniques',
        'Questions/réponses illimitées',
        'Estimation des coûts si nécessaire',
      ],
      user: 'Professionnel',
      duration: 'Quelques heures',
    },
    {
      step: '4',
      icon: CheckCircle,
      title: 'Exprimez Votre Intérêt',
      description:
        'Confirmez votre intérêt pour le projet. Le client choisit parmi les candidats.',
      details: [
        'Candidature simple et rapide',
        'Présentation de votre expertise',
        'Disponibilités et délais proposés',
        'Pas de frais à cette étape',
      ],
      user: 'Professionnel',
      duration: '5 minutes',
    },
    {
      step: '5',
      icon: Shield,
      title: 'Paiement par Succès',
      description:
        'UNIQUEMENT si le client vous choisit : payez selon le palier du projet et obtenez ses coordonnées.',
      details: [
        'Paiement unique selon taille projet (€39-€199)',
        'Coordonnées client débloquées instantanément',
        'Garantie 30 jours satisfait ou remboursé',
        'Facture et justificatif immédiat',
      ],
      user: 'Professionnel',
      duration: '2 minutes',
    },
    {
      step: '6',
      icon: Award,
      title: 'Réalisez et Notez',
      description:
        'Contactez le client, réalisez les travaux et recevez une notation pour votre réputation.',
      details: [
        'Communication directe avec le client',
        'Planification et exécution des travaux',
        'Notation réciproque après projet',
        'Amélioration de votre visibilité',
      ],
      user: 'Professionnel',
      duration: 'Durée du projet',
    },
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: '80% de Taux de Conversion',
      description:
        'Un match SwipeTonPro mène au projet dans 80% des cas. Le client vous a déjà choisi !',
      stats: 'vs 5-10% sur les autres plateformes',
    },
    {
      icon: Euro,
      title: 'ROI Exceptionnel',
      description:
        "Investissez €39 pour un projet de €800 avec 80% de chance de l'obtenir.",
      stats: 'ROI moyen de 1,540%',
    },
    {
      icon: Shield,
      title: 'Garantie Totale',
      description:
        'Satisfait ou remboursé sous 30 jours. Aucun risque pour vous.',
      stats: '100% de remboursement garanti',
    },
    {
      icon: Users,
      title: 'Maximum 3 Concurrents',
      description:
        'Plus de concurrence massive. 1 chance sur 3 au lieu de 1 sur 20.',
      stats: '6x plus de chances',
    },
  ];

  const pricing = [
    {
      name: 'Bronze',
      price: '€39',
      projectValue: "Jusqu'à €800",
      roi: '1,540%',
      color: 'border-orange-200 bg-orange-50',
    },
    {
      name: 'Argent',
      price: '€79',
      projectValue: "Jusqu'à €4,000",
      roi: '4,050%',
      color: 'border-gray-200 bg-gray-50',
    },
    {
      name: 'Or',
      price: '€149',
      projectValue: "Jusqu'à €12,000",
      roi: '6,443%',
      color: 'border-yellow-200 bg-yellow-50',
    },
    {
      name: 'Platinum',
      price: '€199',
      projectValue: 'Plus de €20,000',
      roi: '12,060%',
      color: 'border-purple-200 bg-purple-50',
    },
  ];

  return (
    <>
      <SEO
        title="Comment Ça Marche Professionnels - SwipeTonPro"
        description="Le processus SwipeTonPro pour les professionnels du BTP : inscription, recherche projets, qualification, matching et paiement par succès."
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/90">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à l'accueil
              </Link>

              <Link href="/professionnel">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:shadow-lg transition-all">
                  <Hammer className="mr-2 h-4 w-4" />
                  Espace Professionnel
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600/5 to-blue-400/5">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-heading font-black mb-6">
                Comment Ça Marche pour les{' '}
                <span className="text-blue-600">Professionnels</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                6 étapes simples pour trouver des projets qualifiés et
                développer votre activité
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/professionnel/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold px-8 py-4 shadow-xl hover:scale-105 transition-all"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    S'inscrire Gratuitement
                  </Button>
                </Link>
                <Link href="/professionnel/fonctionnalites">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4"
                  >
                    Voir les Fonctionnalités
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-black mb-4">
                Votre Parcours en{' '}
                <span className="text-blue-600">6 Étapes</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Un processus optimisé pour maximiser vos chances de succès
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-8 items-center mb-16 last:mb-0"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                      {step.step}
                    </div>
                  </div>

                  <div className="flex-1">
                    <Card className="border-border/50 hover:border-blue-600/50 transition-all hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                            <step.icon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-heading font-bold mb-2">
                              {step.title}
                            </h3>
                            <p className="text-muted-foreground mb-4 leading-relaxed">
                              {step.description}
                            </p>
                            <div className="mb-4 flex items-center gap-4">
                              <span className="inline-block px-3 py-1 bg-blue-600/10 text-blue-600 text-sm font-medium rounded-full">
                                {step.user}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Durée : {step.duration}
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {step.details.map((detail, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-muted-foreground">
                                    {detail}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-black mb-4">
                Pourquoi Ça{' '}
                <span className="text-blue-600">Marche Vraiment</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Des avantages concrets qui font la différence avec les autres
                plateformes
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="border-border/50 hover:border-blue-600/50 transition-all hover:shadow-lg"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                        {(() => {
                          const Icon = benefit.icon;
                          return <Icon className="h-6 w-6 text-blue-600" />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-heading font-bold mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          {benefit.description}
                        </p>
                        <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-600">
                            {benefit.stats}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-black mb-4">
                Tarification <span className="text-blue-600">Par Succès</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Payez uniquement si la mise en relation réussit. Pas
                d'abonnement, pas de frais fixes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {pricing.map((plan, index) => (
                <Card
                  key={index}
                  className={`text-center border-2 ${plan.color} hover:shadow-lg transition-all hover:scale-105`}
                >
                  <CardContent className="p-6">
                    <h3 className="text-xl font-heading font-bold mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-3xl font-heading font-black text-blue-600 mb-2">
                      {plan.price}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium mb-2">
                      {plan.projectValue}
                    </div>
                    <div className="bg-blue-600/10 rounded-lg p-2 mb-4">
                      <p className="text-sm font-bold text-blue-600">
                        ROI : {plan.roi}
                      </p>
                    </div>
                    <Link href="/professionnel/signup">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                        Choisir {plan.name}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-400 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-black mb-6">
              Prêt à Transformer Votre{' '}
              <span className="text-yellow-300">Activité</span> ?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Rejoignez des milliers de professionnels qui augmentent leur
              chiffre d'affaires avec SwipeTonPro
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/professionnel/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl hover:scale-105 transition-all"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  S'inscrire Maintenant
                </Button>
              </Link>
              <Link href="/professionnel/fonctionnalites">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold"
                >
                  Toutes les fonctionnalités
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
