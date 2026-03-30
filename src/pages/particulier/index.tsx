import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, MessageSquare, Euro, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { authService } from "@/services/authService";

export default function ParticulierPage() {
  // Plus de création automatique de compte invité
  // L'utilisateur doit s'inscrire manuellement
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const session = await authService.getCurrentSession();
    setIsLoggedIn(!!session);
  };
  return (
    <>
      <SEO 
        title="Particulier - Trouvez votre professionnel BTP"
        description="Décrivez votre projet, uploadez vos photos, obtenez une estimation IA et recevez des propositions de pros certifiés."
      />

      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface">
        {/* Header */}
        <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Retour</span>
              </Link>
              <div className="font-mono text-sm font-semibold text-primary">Espace Particulier</div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Décrivez votre projet <span className="gradient-primary bg-clip-text text-transparent">en quelques clics</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Notre assistant IA vous guide pour obtenir une estimation précise et trouver le professionnel idéal
            </p>
          </div>

          {/* Process Steps */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="border-2 border-primary animate-slide-up">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold mb-2">1. Description</h3>
                <p className="text-sm text-text-secondary">Diagnostic conversationnel IA</p>
              </CardContent>
            </Card>

            <Card className="border-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-bold mb-2">2. Photos</h3>
                <p className="text-sm text-text-secondary">Upload de la zone des travaux</p>
              </CardContent>
            </Card>

            <Card className="border-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Euro className="w-6 h-6 text-success" />
                </div>
                <h3 className="font-bold mb-2">3. Estimation</h3>
                <p className="text-sm text-text-secondary">Budget IA haute sécurité</p>
              </CardContent>
            </Card>

            <Card className="border-2 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-warning" />
                </div>
                <h3 className="font-bold mb-2">4. Validation</h3>
                <p className="text-sm text-text-secondary">Confirmez votre budget</p>
              </CardContent>
            </Card>
          </div>

          {/* Main CTA */}
          <Card className="border-2 border-primary shadow-lg animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Commencer mon diagnostic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-surface-elevated rounded-xl p-6 space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Ce qui est inclus :
                </h4>
                <ul className="space-y-3 text-text-secondary">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Analyse IA de vos photos avec quadrillage technique automatique</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Estimation haute incluant +25% pour imprévus et nettoyage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Matching avec des pros certifiés (SIRET + Assurance Décennale)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span>Aucun contact direct avant validation mutuelle</span>
                  </li>
                </ul>
              </div>

              <Link href="/particulier/create-account?redirect=diagnostic" className="block">
                <Button size="lg" className="w-full gradient-primary text-white text-lg font-semibold py-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                  Démarrer mon projet
                </Button>
              </Link>

              <p className="text-center text-sm text-text-muted">
                Gratuit et sans engagement • Vos données sont protégées
              </p>
            </CardContent>
          </Card>

          {/* Trust Section */}
          <div className="mt-12 grid sm:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <p className="text-sm text-text-secondary">Pros certifiés</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">0€</div>
                <p className="text-sm text-text-secondary">Pour les particuliers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <p className="text-sm text-text-secondary">Support disponible</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}