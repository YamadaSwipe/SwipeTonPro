import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { 
  Shield, 
  Zap, 
  Users, 
  Hammer, 
  Clock, 
  Award,
  CheckCircle2,
  ArrowLeft,
  Star,
  Lock,
  MessageSquare,
  Calendar,
  MapPin,
  Euro,
  Target,
  TrendingUp
} from "lucide-react";

export default function ProfessionnelsFonctionnalitesPage() {
  const features = [
    {
      icon: Shield,
      title: "Protection des Données",
      description: "Vos coordonnées ne sont partagées qu'après validation mutuelle. Fini les appels abusifs.",
      details: [
        "Contrôle total sur vos informations",
        "Validation mutuelle obligatoire",
        "Pas de partage sans consentement",
        "Anti-spam téléphonique garanti"
      ],
      color: "text-blue-600",
      priority: "high"
    },
    {
      icon: Target,
      title: "Matching Intelligent",
      description: "Système d'intérêt mutuel : vous choisissez, le client valide. Plus de temps perdu.",
      details: [
        "Filtrage par localisation et compétences",
        "Matching basé sur vos critères",
        "Qualification préalable des projets",
        "Maximum 3 pros par projet = moins de concurrence"
      ],
      color: "text-green-600",
      priority: "high"
    },
    {
      icon: Lock,
      title: "Paiement par Succès",
      description: "Payez UNIQUEMENT si la mise en relation réussit. Pas d'abonnement, pas de frais fixes.",
      details: [
        "Paiement unique selon palier projet (€39-€199)",
        "Garantie 30 jours satisfait ou remboursé",
        "Pas de frais sans résultat",
        "80% de conversion : client déjà choisi !"
      ],
      color: "text-purple-600",
      priority: "high"
    },
    {
      icon: MessageSquare,
      title: "Communication Pré-match",
      description: "Discutez avec les clients avant engagement pour qualifier les besoins et établir la confiance.",
      details: [
        "Messagerie intégrée sécurisée",
        "Partage de photos et documents",
        "Historique des conversations",
        "Qualification sans engagement"
      ],
      color: "text-orange-600",
      priority: "medium"
    },
    {
      icon: Calendar,
      title: "Planning Intégré",
      description: "Planifiez vos visites et rendez-vous directement depuis la plateforme. Plus d'aller-retour par téléphone.",
      details: [
        "Calendrier partagé avec les clients",
        "Rappels automatiques",
        "Gestion des disponibilités",
        "Optimisation des trajets"
      ],
      color: "text-red-600",
      priority: "medium"
    },
    {
      icon: Award,
      title: "Système de Notation",
      description: "Notez et soyez noté après chaque projet. Construisez votre réputation et gagnez la confiance.",
      details: [
        "Notation détaillée (qualité, ponctualité, communication)",
        "Avis vérifiés uniquement",
        "Impact sur votre visibilité",
        "Badge de confiance selon niveau"
      ],
      color: "text-yellow-600",
      priority: "medium"
    },
    {
      icon: TrendingUp,
      title: "Analytics Pro",
      description: "Suivez vos performances, analysez vos taux de conversion et optimisez votre stratégie.",
      details: [
        "Tableau de bord personnalisé",
        "Suivi des candidatures et conversions",
        "Analyse des taux de réussite",
        "Recommandations d'optimisation"
      ],
      color: "text-indigo-600",
      priority: "low"
    },
    {
      icon: MapPin,
      title: "Géolocalisation Précise",
      description: "Trouvez des projets près de chez vous avec notre système de géolocalisation avancé.",
      details: [
        "Filtre par rayon kilométrique",
        "Alertes nouveaux projets locaux",
        "Optimisation des trajets",
        "Zone d'intervention personnalisable"
      ],
      color: "text-emerald-600",
      priority: "low"
    }
  ];

  const pricing = [
    {
      name: "Bronze",
      price: "€39",
      projectRange: "Projets < €1,500",
      features: [
        "Accès complet aux projets",
        "Communication illimitée",
        "Coordonnées client après paiement",
        "Garantie 30 jours"
      ],
      color: "border-orange-200 bg-orange-50"
    },
    {
      name: "Argent",
      price: "€79", 
      projectRange: "Projets €1,500-7,000",
      features: [
        "Tout le niveau Bronze",
        "Priorité modérée",
        "Badge 'Vérifié+'",
        "Support prioritaire"
      ],
      color: "border-gray-200 bg-gray-50"
    },
    {
      name: "Or",
      price: "€149",
      projectRange: "Projets €7,000-20,000", 
      features: [
        "Tout le niveau Argent",
        "Priorité haute",
        "Badge 'Confiance'",
        "Analytics avancées"
      ],
      color: "border-yellow-200 bg-yellow-50"
    },
    {
      name: "Platinum",
      price: "€199",
      projectRange: "Projets > €20,000",
      features: [
        "Tout le niveau Or",
        "Priorité maximum",
        "Badge 'Elite'",
        "Support dédié 24/7"
      ],
      color: "border-purple-200 bg-purple-50"
    }
  ];

  return (
    <>
      <SEO 
        title="Fonctionnalités Professionnels - SwipeTonPro" 
        description="Découvrez toutes les fonctionnalités de SwipeTonPro pour les professionnels du BTP : matching intelligent, paiement par succès, protection des données."
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
                Fonctionnalités <span className="text-blue-600">Professionnels</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Des outils conçus pour vous faire <strong>gagner du temps</strong> et <strong>augmenter votre chiffre d'affaires</strong>
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/professionnel/signup">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold px-8 py-4 shadow-xl hover:scale-105 transition-all">
                    <Zap className="mr-2 h-5 w-5" />
                    Commencer Gratuitement
                  </Button>
                </Link>
                <Link href="#tarifs">
                  <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4">
                    <Euro className="mr-2 h-5 w-5" />
                    Voir les Tarifs
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
                Tout ce Dont Vous Avez <span className="text-blue-600">Besoin</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Des fonctionnalités développées avec et pour les professionnels du BTP
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className={`border-border/50 hover:border-blue-600/50 transition-all hover:shadow-lg hover:-translate-y-1 group ${
                    feature.priority === 'high' ? 'ring-2 ring-blue-600/20' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-blue-600/10 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:scale-110 transition-all">
                      <feature.icon className={`h-6 w-6 ${feature.color} group-hover:text-white`} />
                    </div>
                    <CardTitle className="text-xl font-heading font-bold flex items-center gap-2">
                      {feature.title}
                      {feature.priority === 'high' && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                          Populaire
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
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
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

        {/* Pricing Section */}
        <section id="tarifs" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-black mb-4">
                Tarification <span className="text-blue-600">Transparente</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Payez uniquement en cas de succès. Pas d'abonnement, pas de frais cachés.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {pricing.map((plan, index) => (
                <Card key={index} className={`text-center border-2 ${plan.color} hover:shadow-lg transition-all hover:scale-105`}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-heading font-bold mb-2">{plan.name}</h3>
                    <div className="text-3xl font-heading font-black text-blue-600 mb-2">{plan.price}</div>
                    <div className="text-sm text-muted-foreground font-medium mb-4">{plan.projectRange}</div>
                    <ul className="space-y-2 text-left mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/professionnel/signup">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                        Choisir {plan.name}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-bold text-blue-600 mb-4">💡 Pourquoi ce modèle fonctionne ?</h3>
                <div className="text-left space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>80% de conversion</strong> : Un match = client déjà choisi
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>ROI explosif</strong> : €39 investis → €640 de CA moyen
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Garantie totale</strong> : 30 jours satisfait ou remboursé
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-400 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-black mb-6">
              Prêt à Transformer Votre <span className="text-yellow-300">Activité</span> ?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Rejoignez des milliers de professionnels qui ont déjà augmenté leur chiffre d'affaires avec SwipeTonPro
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/professionnel/signup">
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-white/90 px-8 py-4 text-lg font-semibold shadow-xl hover:scale-105 transition-all">
                  <Zap className="mr-2 h-5 w-5" />
                  S'inscrire Gratuitement
                </Button>
              </Link>
              <Link href="/professionnel/comment-ca-marche">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold">
                  Comment ça marche
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
