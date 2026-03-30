import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  HardHat, 
  MessageSquare, 
  Heart, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Clock,
  Star
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CommentCaMarche() {
  const [activeTab, setActiveTab] = useState<'particulier' | 'artisan'>('particulier');

  return (
    <>
      <SEO 
        title="Comment ça Marche - SwipeTonPro"
        description="Découvrez comment SwipeTonPro fonctionne : créez votre projet, recevez des candidatures d'artisans qualifiés, et choisissez le meilleur professionnel pour vos travaux."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        {/* Hero Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Comment ça Marche
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              La révolution de la mise en relation BTP : simple, sécurisée et équitable
            </p>
            
            {/* Tab Selector */}
            <div className="inline-flex bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-12">
              <button
                onClick={() => setActiveTab('particulier')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'particulier'
                    ? 'bg-orange-600 text-white'
                    : 'text-slate-600 hover:text-orange-600'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Particulier
              </button>
              <button
                onClick={() => setActiveTab('artisan')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === 'artisan'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <HardHat className="w-4 h-4 inline mr-2" />
                Artisan
              </button>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            {activeTab === 'particulier' ? (
              <div className="space-y-8">
                {/* Particulier Steps */}
                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="relative pb-4">
                      <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-white text-2xl font-bold">1</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">
                        Publiez votre projet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">
                        Décrivez vos travaux en quelques minutes. Notre IA vous donne une estimation budgétaire personnalisée.
                      </p>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Gratuit et sans engagement</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Estimation IA immédiate</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="relative pb-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-white text-2xl font-bold">2</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">
                        Recevez des candidatures
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">
                        Les artisans intéressés par votre projet postulent leur candidature avec un devis personnalisé.
                      </p>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Artisans qualifiés uniquement</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Devis détaillés</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="relative pb-4">
                      <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-white text-2xl font-bold">3</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">
                        Choisissez en toute liberté
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">
                        Discutez avec les artisans qui vous intéressent. Débloquez les coordonnées uniquement en cas de match mutuel.
                      </p>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Dialogue limité au début</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Déblocage sur accord mutuel</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Artisan Steps */}
                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="relative pb-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-white text-2xl font-bold">1</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">
                        Consultez les projets
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">
                        Accédez à des projets qualifiés près de chez vous. Filtrez par spécialité et localisation.
                      </p>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Projets vérifiés</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Localisation précise</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="relative pb-4">
                      <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-white text-2xl font-bold">2</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">
                        Postulez avec votre devis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">
                        Proposez votre candidature avec un devis détaillé. Le particulier peut vous contacter pour discuter.
                      </p>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Devis personnalisé</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Message de présentation</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16" />
                    <CardHeader className="relative pb-4">
                      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-white text-2xl font-bold">3</span>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">
                        Débloquez et réalisez
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 mb-4">
                        Si le particulier accepte votre candidature, débloquez ses coordonnées avec des crédits.
                      </p>
                      <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>1 crédit = 1 déblocage</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Paie uniquement si intéressé</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-6">
              Prêt à commencer ?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Rejoignez la révolution de la mise en relation BTP
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/particulier">
                <Button size="lg" className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-8 py-4 rounded-full">
                  <Users className="w-5 h-5 mr-2" />
                  Je suis un particulier
                </Button>
              </Link>
              <Link href="/professionnel">
                <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-full">
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
