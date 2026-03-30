import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  Heart, 
  Users, 
  HardHat, 
  CheckCircle, 
  Star,
  Award,
  Lock,
  Zap,
  TrendingUp,
  MessageSquare,
  Clock,
  MapPin
} from "lucide-react";
import Link from "next/link";

export default function PourquoiNous() {
  return (
    <>
      <SEO 
        title="Pourquoi Nous - SwipeTonPro"
        description="Découvrez pourquoi SwipeTonPro est la meilleure plateforme pour trouver des artisans et des projets de travaux. Sécurité, transparence et matching mutuel."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Pourquoi SwipeTonPro
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              La première marketplace BTP qui protège vraiment les deux parties
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Nos Valeurs Fondamentales</h2>
              <p className="text-lg text-slate-600">
                Ce qui nous différencie des autres plateformes
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center border-0 shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Sécurité Mutuelle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Protection complète pour particuliers et artisans avec vérification d'identité et contrôle qualité.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Match Mutuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Chaque partie choisit librement. Plus de contacts forcés ou d'appels commerciaux intempestifs.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Efficacité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Gagnez du temps avec des projets qualifiés et des artisans sérieux uniquement.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Qualité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">
                    Artisans certifiés et vérifiés. Système de notation transparent pour garantir la qualité.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">SwipeTonPro vs Autres Plateformes</h2>
              <p className="text-lg text-slate-600">
                Une approche radicalement différente
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4 font-semibold text-slate-900">Fonctionnalité</th>
                    <th className="text-center p-4 font-semibold text-orange-600">SwipeTonPro</th>
                    <th className="text-center p-4 font-semibold text-slate-600">Autres Plateformes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4 text-slate-900">Matching mutuel</td>
                    <td className="text-center p-4">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center p-4">
                      <span className="text-red-500">✗</span>
                    </td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="p-4 text-slate-900">Pas d'appels commerciaux</td>
                    <td className="text-center p-4">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center p-4">
                      <span className="text-red-500">✗</span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 text-slate-900">Vérification artisans</td>
                    <td className="text-center p-4">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center p-4">
                      <span className="text-yellow-500">⚠</span>
                    </td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="p-4 text-slate-900">Gratuit pour particuliers</td>
                    <td className="text-center p-4">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center p-4">
                      <span className="text-yellow-500">⚠</span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4 text-slate-900">Dialogue limité au début</td>
                    <td className="text-center p-4">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center p-4">
                      <span className="text-red-500">✗</span>
                    </td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="p-4 text-slate-900">Notation transparente</td>
                    <td className="text-center p-4">
                      <CheckCircle className="w-6 h-6 text-green-500 mx-auto" />
                    </td>
                    <td className="text-center p-4">
                      <span className="text-yellow-500">⚠</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Benefits by User Type */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Particuliers */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-orange-600 mb-4">
                    Pour les Particuliers
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Plus de spam commercial</h4>
                      <p className="text-slate-600 text-sm">Finis les appels et emails non sollicités</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Artisans vérifiés</h4>
                      <p className="text-slate-600 text-sm">Professionnels certifiés et notés</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Choix total</h4>
                      <p className="text-slate-600 text-sm">Décidez avec qui échanger et travailler</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Gratuit</h4>
                      <p className="text-slate-600 text-sm">Publiez vos projets sans aucun frais</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Artisans */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HardHat className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-600 mb-4">
                    Pour les Artisans
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Projets qualifiés</h4>
                      <p className="text-slate-600 text-sm">Accès à des demandes réelles et sérieuses</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Pas de perte de temps</h4>
                      <p className="text-slate-600 text-sm">Contactez uniquement les projets qui vous intéressent</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Coût maîtrisé</h4>
                      <p className="text-slate-600 text-sm">Payez uniquement pour les contacts qui vous intéressent</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Visibilité locale</h4>
                      <p className="text-slate-600 text-sm">Projets près de votre zone d'intervention</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-orange-600 to-amber-600">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Rejoignez la Révolution BTP
            </h2>
            <p className="text-xl text-orange-50 mb-8">
              Des milliers de particuliers et artisans nous font déjà confiance
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/particulier">
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 rounded-full">
                  <Users className="w-5 h-5 mr-2" />
                  Je suis un particulier
                </Button>
              </Link>
              <Link href="/professionnel">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-full">
                  <HardHat className="w-5 h-5 mr-2" />
                  Je suis un artisan
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
