import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Heart, Users, HardHat, CheckCircle, Star, Award, MessageSquare, Zap, TrendingUp, Clock, MapPin, Target, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Fonctionnalites() {
  return (
    <>
      <SEO 
        title="Fonctionnalités - SwipeTonPro"
        description="Découvrez toutes les fonctionnalités de SwipeTonPro : matching mutuel, sécurisation des échanges, notation transparente, et bien plus encore."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        {/* Header avec bouton retour */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Retour à l'accueil</span>
              </Link>
              
              <div className="flex items-center gap-4">
                <Link href="/particulier">
                  <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Particulier
                  </Button>
                </Link>
                <Link href="/professionnel">
                  <Button variant="outline" size="sm">
                    <HardHat className="w-4 h-4 mr-2" />
                    Professionnel
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Fonctionnalités Innovantes
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              La technologie au service de la mise en relation BTP
            </p>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Fonctionnalités Principales</h2>
              <p className="text-lg text-slate-600">
                Ce qui rend SwipeTonPro unique
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Matching Mutuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Le professionnel choisit le projet, le particulier choisit le professionnel. Uniquement si l'intérêt est réciproque.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Double validation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Consentement mutuel</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Sécurité Renforcée
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Vérification d'identité, contrôle des certifications et protection des données personnelles.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Artisans certifiés</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Données protégées</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Dialogue Sécurisé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Échangez via notre messagerie intégrée avant de débloquer les coordonnées personnelles.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Messages limités au début</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Modération active</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Notation Transparente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Système de notation mutuelle après chaque projet pour garantir la qualité et la confiance.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Évaluation mutuelle</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Commentaires vérifiés</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Estimation IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Obtenez une estimation budgétaire instantanée grâce à notre intelligence artificielle.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Analyse instantanée</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Budget personnalisé</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-red-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Déblocage Sécurisé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">
                    Les coordonnées sont débloquées uniquement après accord mutuel et validation.
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Protection vie privée</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Consentement explicite</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Advanced Features */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Fonctionnalités Avancées</h2>
              <p className="text-lg text-slate-600">
                Pour une expérience complète
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-orange-600" />
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Géolocalisation Précise
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      Projets et artisans localisés avec précision pour optimiser les déplacements et la pertinence des matchs.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Notifications en Temps Réel
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      Alertes instantanées pour nouvelles candidatures, messages et mises à jour de projets.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-amber-600" />
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Tableaux de Bord
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      Interface complète pour suivre vos projets, candidatures et performances.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Target className="w-6 h-6 text-green-600" />
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Filtres Avancés
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      Recherche par spécialité, budget, localisation, disponibilité et bien plus encore.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-purple-600" />
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Badges de Confiance
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      Distinctions visibles pour artisans vérifiés, certifiés RGE et excellents avis.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-red-600" />
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-900">
                        Support Dédié
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">
                      Assistance technique et modération 7j/7 pour garantir une expérience sereine.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-orange-600 to-amber-600">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Prêt à Expérimenter ?
            </h2>
            <p className="text-xl text-orange-50 mb-8">
              Découvrez la différence avec SwipeTonPro
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/particulier">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 rounded-full">
                  <Users className="w-5 h-5 mr-2" />
                  Commencer un projet
                </Button>
              </Link>
              <Link href="/professionnel">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-full">
                  <HardHat className="w-5 h-5 mr-2" />
                  Devenir artisan
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
