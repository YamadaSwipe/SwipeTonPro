import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { 
  Shield, 
  Users, 
  Hammer, 
  Clock, 
  Award,
  CheckCircle2,
  ArrowLeft,
  Star,
  MessageSquare,
  Calendar,
  MapPin,
  Home,
  Heart,
  Zap
} from "lucide-react";

export default function ParticuliersFonctionnalitesPage() {
  const features = [
    {
      icon: Home,
      title: "Dépôt Projet Gratuit",
      description: "Déposez votre projet gratuitement en quelques minutes. Qualification humaine 24h garantie.",
      details: [
        "Description détaillée des travaux",
        "Upload photos et documents",
        "Budget et délais définis",
        "Validation par notre équipe d'experts"
      ],
      color: "text-emerald-600",
      priority: "high"
    },
    {
      icon: Users,
      title: "Professionnels Qualifiés",
      description: "Accédez à des professionnels vérifiés, notés et assurés. Plus de craintes sur la qualité.",
      details: [
        "Vérification SIRET et assurances",
        "Système de notation transparent",
        "Maximum 3 pros par projet = pas de surcharge",
        "Professionnels motivés (ont payé pour vous contacter)"
      ],
      color: "text-blue-600",
      priority: "high"
    },
    {
      icon: Shield,
      title: "Protection Totale",
      description: "Vos coordonnées sont protégées. Pas de démarchage abusif. Vous contrôlez qui vous contacte.",
      details: [
        "Coordonnées partagées après accord mutuel",
        "Pas d'appels non sollicités",
        "Contrôle total sur les contacts",
        "Système anti-arnaque intégré"
      ],
      color: "text-green-600",
      priority: "high"
    },
    {
      icon: MessageSquare,
      title: "Dialogue Sécurisé",
      description: "Communiquez avec les professionnels avant de vous engager. Qualifiez les besoins en toute sécurité.",
      details: [
        "Messagerie intégrée et sécurisée",
        "Partage de photos et plans",
        "Questions/réponses illimitées",
        "Historique conservé et accessible"
      ],
      color: "text-purple-600",
      priority: "medium"
    },
    {
      icon: CheckCircle2,
      title: "Matching Contrôlé",
      description: "Choisissez jusqu'à 3 professionnels. Double validation pour garantir la qualité et éviter la surcharge.",
      details: [
        "Sélection libre des professionnels",
        "Validation mutuelle obligatoire",
        "Pas de surconcurrence (max 3 pros)",
        "Processus transparent et équitable"
      ],
      color: "text-orange-600",
      priority: "medium"
    },
    {
      icon: Star,
      title: "Satisfaction Garantie",
      description: "Accédez aux notes et avis des professionnels. Faites le bon choix en toute confiance.",
      details: [
        "Notes détaillées et vérifiées",
        "Témoignages authentiques",
        "Historique des projets réalisés",
        "Support client 7j/7 pour vous accompagner"
      ],
      color: "text-yellow-600",
      priority: "medium"
    },
    {
      icon: Calendar,
      title: "Planning Simplifié",
      description: "Planifiez vos visites et rendez-vous directement depuis la plateforme. Plus d'aller-retour par téléphone.",
      details: [
        "Calendrier partagé avec les professionnels",
        "Rappels automatiques des RDV",
        "Gestion des disponibilités",
        "Historique des rendez-vous"
      ],
      color: "text-red-600",
      priority: "low"
    },
    {
      icon: Heart,
      title: "Accompagnement Personnel",
      description: "Notre équipe vous accompagne à chaque étape. De la publication à la réalisation des travaux.",
      details: [
        "Support par téléphone et email",
        "Conseils pour choisir le bon professionnel",
        "Médiation si nécessaire",
        "Suivi personnalisé de votre projet"
      ],
      color: "text-pink-600",
      priority: "low"
    }
  ];

  const advantages = [
    {
      icon: Zap,
      title: "100% Gratuit",
      description: "Toutes nos fonctionnalités sont gratuites pour les particuliers. Aucun frais caché.",
      details: [
        "Dépôt projet gratuit",
        "Accès aux professionnels gratuit",
        "Communication illimitée gratuite",
        "Support client gratuit"
      ]
    },
    {
      icon: Shield,
      title: "Sécurité Maximale",
      description: "Votre sécurité est notre priorité. Protection totale de vos données et coordonnées.",
      details: [
        "Coordonnées protégées",
        "Professionnels vérifiés",
        "Système anti-arnaque",
        "Paiements sécurisés"
      ]
    },
    {
      icon: Users,
      title: "Qualité Assurance",
      description: "Accédez uniquement aux meilleurs professionnels. Qualité et fiabilité garanties.",
      details: [
        "Professionnels notés et vérifiés",
        "Maximum 3 candidats par projet",
        "Historique des projets réussis",
        "Garantie satisfaction"
      ]
    },
    {
      icon: Heart,
      title: "Service Client",
      description: "Une équipe dédiée pour vous aider à chaque étape de votre projet.",
      details: [
        "Support 7j/7",
        "Conseils personnalisés",
        "Accompagnement projet",
        "Médiation si nécessaire"
      ]
    }
  ];

  return (
    <>
      <SEO 
        title="Fonctionnalités Particuliers - SwipeTonPro" 
        description="Découvrez toutes les fonctionnalités de SwipeTonPro pour les particuliers : dépôt projet gratuit, professionnels qualifiés, protection totale."
      />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/90">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
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
                Fonctionnalités <span className="text-emerald-600">Particuliers</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Des outils simples et <strong>gratuits</strong> pour trouver le professionnel parfait et mener vos projets à bien
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/particulier/diagnostic">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold px-8 py-4 shadow-xl hover:scale-105 transition-all">
                    <Zap className="mr-2 h-5 w-5" />
                    Démarrer mon Projet
                  </Button>
                </Link>
                <Link href="/particulier/comment-ca-marche">
                  <Button size="lg" variant="outline" className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white px-8 py-4">
                    Comment ça marche
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Main Features */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-black mb-4">
                Tout ce Dont Vous Avez <span className="text-emerald-600">Besoin</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Des fonctionnalités conçues pour simplifier vos projets de A à Z
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className={`border-border/50 hover:border-emerald-600/50 transition-all hover:shadow-lg hover:-translate-y-1 group ${
                    feature.priority === 'high' ? 'ring-2 ring-emerald-600/20' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-emerald-600/10 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:scale-110 transition-all">
                      <feature.icon className={`h-6 w-6 ${feature.color} group-hover:text-white`} />
                    </div>
                    <CardTitle className="text-xl font-heading font-bold flex items-center gap-2">
                      {feature.title}
                      {feature.priority === 'high' && (
                        <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full">
                          Essentiel
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Advantages Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-black mb-4">
                Pourquoi <span className="text-emerald-600">SwipeTonPro</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Des avantages concrets qui font la différence
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {advantages.map((advantage, index) => (
                <Card key={index} className="text-center border-border/50 hover:border-emerald-600/50 transition-all hover:shadow-lg">
                  <CardContent className="p-8">
                    <div className="h-16 w-16 rounded-lg bg-emerald-600/10 flex items-center justify-center mx-auto mb-6">
                      <advantage.icon className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-heading font-bold mb-4">{advantage.title}</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {advantage.description}
                    </p>
                    <ul className="space-y-3 text-left">
                      {advantage.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{detail}</span>
                        </li>
                      ))}
                    </ul>
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
              Prêt à Démarrer Votre <span className="text-yellow-300">Projet</span> ?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Rejoignez des milliers de particuliers qui ont trouvé le professionnel parfait avec SwipeTonPro
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/particulier/diagnostic">
                <Button size="lg" variant="secondary" className="bg-white text-emerald-600 hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl hover:scale-105 transition-all">
                  <Zap className="mr-2 h-5 w-5" />
                  Commencer Gratuitement
                </Button>
              </Link>
              <Link href="/particulier/comment-ca-marche">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 px-8 py-4 text-lg font-semibold">
                  En savoir plus
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
