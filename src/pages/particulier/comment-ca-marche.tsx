import React from 'react';
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
  Home,
  Heart,
} from 'lucide-react';

export default function ParticuliersCommentCaMarchePage() {
  const steps = [
    {
      step: '1',
      icon: Home,
      title: 'Décrivez Votre Projet',
      description:
        'Déposez votre projet gratuitement en quelques minutes. Qualification humaine garantie 24h.',
      details: [
        'Description détaillée des travaux souhaités',
        'Upload photos et documents existants',
        'Budget et délais définis',
        'Localisation précise du chantier',
      ],
      user: 'Particulier',
      duration: '10 minutes',
    },
    {
      step: '2',
      icon: Users,
      title: 'Recevez les Candidatures',
      description:
        'Les professionnels qualifiés postulent. Maximum 3 candidats pour éviter la surcharge.',
      details: [
        'Professionnels pré-sélectionnés et vérifiés',
        'Maximum 3 candidats par projet',
        'Profils détaillés avec notes et avis',
        'Pas de démarchage abusif',
      ],
      user: 'Particulier',
      duration: '24-48h',
    },
    {
      step: '3',
      icon: MessageSquare,
      title: 'Dialogue Sécurisé',
      description:
        'Discutez avec les professionnels via messagerie sécurisée avant de vous engager.',
      details: [
        'Messagerie intégrée et confidentielle',
        'Partage de photos et plans',
        'Questions/réponses illimitées',
        'Coordonnées protégées à ce stade',
      ],
      user: 'Particulier',
      duration: 'Quelques jours',
    },
    {
      step: '4',
      icon: CheckCircle,
      title: 'Choisissez Votre Pro',
      description:
        'Sélectionnez le professionnel qui vous convient le mieux. Validation mutuelle obligatoire.',
      details: [
        'Comparaison des profils et compétences',
        'Vérification des notes et avis',
        'Choix final basé sur vos critères',
        'Validation par le professionnel',
      ],
      user: 'Particulier',
      duration: '1-2 jours',
    },
    {
      step: '5',
      icon: Phone,
      title: 'Communication Directe',
      description:
        'Échangez vos coordonnées et commencez la communication directe avec votre professionnel.',
      details: [
        'Coordonnées mutuelles échangées',
        'Planification des visites techniques',
        'Discussions téléphoniques et rendez-vous',
        '100% gratuit pour vous',
      ],
      user: 'Particulier',
      duration: 'Immédiat',
    },
    {
      step: '6',
      icon: Star,
      title: 'Réalisation et Notation',
      description:
        'Suivez vos travaux, puis notez le professionnel pour aider la communauté.',
      details: [
        'Suivi des travaux en temps réel',
        'Communication directe permanente',
        'Notation détaillée après achèvement',
        'Contribution à la qualité de la plateforme',
      ],
      user: 'Particulier',
      duration: 'Durée du projet',
    },
  ];

  const benefits = [
    {
      icon: Heart,
      title: '100% Gratuit',
      description:
        'Toutes nos fonctionnalités sont gratuites pour les particuliers. Aucun frais caché.',
      stats: '0€ de A à Z',
    },
    {
      icon: Shield,
      title: 'Protection Totale',
      description:
        'Vos coordonnées sont protégées. Pas de démarchage abusif. Vous contrôlez qui vous contacte.',
      stats: 'Anti-spam garanti',
    },
    {
      icon: Users,
      title: 'Qualité Assurance',
      description:
        'Accédez uniquement aux meilleurs professionnels. Qualité et fiabilité garanties.',
      stats: 'Pros vérifiés et notés',
    },
    {
      icon: Lock,
      title: 'Paiement Séquestré',
      description:
        'Protection de vos fonds via notre opérateur partenaire. Acompte et travaux sécurisés, déblocage par étapes.',
      stats: '100% sécurisé',
    },
  ];

  const guarantees = [
    {
      icon: Lock,
      title: 'Paiement Séquestré',
      description:
        "Protection de vos fonds via notre opérateur partenaire. Choix de bloquer l'acompte + travaux, libération par étapes validées avec l'artisan.",
    },
    {
      icon: Shield,
      title: 'Professionnels Vérifiés',
      description:
        'Tous nos professionnels sont vérifiés : SIRET, assurances, compétences.',
    },
    {
      icon: CheckCircle,
      title: 'Qualification Humaine',
      description:
        'Chaque projet est vérifié par notre équipe dans les 24h suivant sa publication.',
    },
    {
      icon: Heart,
      title: 'Support Dédié',
      description:
        'Une équipe disponible 7j/7 pour vous accompagner à chaque étape de votre projet.',
    },
    {
      icon: Star,
      title: 'Garantie Satisfaction',
      description:
        "Si vous n'êtes pas satisfait, nous vous aidons à trouver une solution rapidement.",
    },
  ];

  return (
    <>
      <SEO
        title="Comment Ça Marche Particuliers - SwipeTonPro"
        description="Le processus SwipeTonPro pour les particuliers : dépôt projet gratuit, professionnels qualifiés, dialogue sécurisé et réalisation des travaux."
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

              <Link href="/particulier">
                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold hover:shadow-lg transition-all">
                  <Home className="mr-2 h-4 w-4" />
                  Espace Particulier
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-emerald-600/5 to-emerald-400/5">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-heading font-black mb-6">
                Comment Ça Marche pour les{' '}
                <span className="text-emerald-600">Particuliers</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                6 étapes simples pour trouver le professionnel parfait et
                réaliser vos projets en toute sécurité
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/particulier/diagnostic">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold px-8 py-4 shadow-xl hover:scale-105 transition-all"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Démarrer mon Projet
                  </Button>
                </Link>
                <Link href="/particulier/fonctionnalites">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white px-8 py-4"
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
                <span className="text-emerald-600">6 Étapes Simples</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Un processus pensé pour votre tranquillité d'esprit et votre
                sécurité
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-8 items-center mb-16 last:mb-0"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                      {step.step}
                    </div>
                  </div>

                  <div className="flex-1">
                    <Card className="border-border/50 hover:border-emerald-600/50 transition-all hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-emerald-600/10 flex items-center justify-center flex-shrink-0">
                            <step.icon className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-heading font-bold mb-2">
                              {step.title}
                            </h3>
                            <p className="text-muted-foreground mb-4 leading-relaxed">
                              {step.description}
                            </p>
                            <div className="mb-4 flex items-center gap-4">
                              <span className="inline-block px-3 py-1 bg-emerald-600/10 text-emerald-600 text-sm font-medium rounded-full">
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
                                  <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
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
                Pourquoi Choisir{' '}
                <span className="text-emerald-600">SwipeTonPro</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Des avantages concrets qui font toute la différence
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="border-border/50 hover:border-emerald-600/50 transition-all hover:shadow-lg"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-600/10 flex items-center justify-center flex-shrink-0">
                        {React.createElement(benefit.icon, {
                          className: 'h-6 w-6 text-emerald-600',
                        })}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-heading font-bold mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-muted-foreground mb-4 leading-relaxed">
                          {benefit.description}
                        </p>
                        <div className="bg-emerald-600/10 border border-emerald-600/20 rounded-lg p-3">
                          <p className="text-sm font-medium text-emerald-600">
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

        {/* Guarantees Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-black mb-4">
                Nos <span className="text-emerald-600">Garanties</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Votre tranquillité d'esprit est notre priorité absolue
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {guarantees.map((guarantee, index) => (
                <Card
                  key={index}
                  className="text-center border-border/50 hover:border-emerald-600/50 transition-all hover:shadow-lg"
                >
                  <CardContent className="p-8">
                    <div className="h-16 w-16 rounded-lg bg-emerald-600/10 flex items-center justify-center mx-auto mb-6">
                      {React.createElement(guarantee.icon, {
                        className: 'h-8 w-8 text-emerald-600',
                      })}
                    </div>
                    <h3 className="text-xl font-heading font-bold mb-4">
                      {guarantee.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {guarantee.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-emerald-600 to-emerald-400 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-black mb-6">
              Prêt à Démarrer Votre{' '}
              <span className="text-yellow-300">Projet</span> ?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Rejoignez des milliers de particuliers qui ont trouvé le
              professionnel parfait avec SwipeTonPro
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/particulier/diagnostic">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-emerald-600 hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl hover:scale-105 transition-all"
                >
                  <Zap className="mr-2 h-5 w-5" />
                  Commencer Gratuitement
                </Button>
              </Link>
              <Link href="/particulier/fonctionnalites">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 px-8 py-4 text-lg font-semibold"
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
