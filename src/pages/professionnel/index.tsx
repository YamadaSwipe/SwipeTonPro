import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Shield,
  Briefcase,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  Users,
  Star,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfessionnelPage() {
  return (
    <>
      <SEO
        title="Professionnel - Trouvez vos clients BTP"
        description="Rejoignez la marketplace BTP premium. Accédez à des chantiers qualifiés, gagnez en visibilité avec votre certification."
      />

      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface">
        {/* Header */}
        <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Retour</span>
              </Link>
              <div className="font-mono text-sm font-semibold text-accent">
                Espace Pro
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-sm font-mono font-semibold text-accent">
                Marketplace Premium
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Développez votre activité avec des{' '}
              <span className="font-extrabold bg-gradient-to-r from-accent via-accent-dark to-accent bg-clip-text text-transparent px-2">
                clients qualifiés
              </span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Accédez à des chantiers pré-analysés par IA, clients sérieux
              uniquement, paiement sécurisé
            </p>
          </div>

          {/* Key Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card className="border-2 border-transparent hover:border-accent transition-all duration-300 hover:shadow-lg animate-slide-up">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">
                      Badge "Certifié par IA"
                    </h3>
                    <p className="text-text-secondary">
                      Validez votre SIRET, assurance décennale et portfolio pour
                      obtenir le badge de confiance visible par tous les
                      clients.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-2 border-transparent hover:border-accent transition-all duration-300 hover:shadow-lg animate-slide-up"
              style={{ animationDelay: '0.1s' }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">
                      Chantiers Pré-Qualifiés
                    </h3>
                    <p className="text-text-secondary">
                      Consultez des projets avec photos, budget estimé,
                      localisation. Zéro démarchage, clients déjà engagés
                      financièrement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-2 border-transparent hover:border-accent transition-all duration-300 hover:shadow-lg animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">
                      Système de Crédits
                    </h3>
                    <p className="text-text-secondary">
                      Rechargez vos crédits, postulez aux chantiers qui vous
                      intéressent. Payez uniquement pour les mises en relation
                      validées.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-2 border-transparent hover:border-accent transition-all duration-300 hover:shadow-lg animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2">
                      Protection Totale
                    </h3>
                    <p className="text-text-secondary">
                      Vos coordonnées et celles du client restent masquées
                      jusqu'à validation mutuelle et paiement. Confidentialité
                      garantie.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Process Steps */}
          <Card
            className="border-2 border-accent shadow-lg mb-12 animate-slide-up overflow-hidden"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="bg-gradient-to-r from-accent/5 to-primary/5 p-6 border-b border-border">
              <CardTitle className="text-2xl text-center">
                Inscription Professionnelle
              </CardTitle>
              <p className="text-text-secondary mt-2 text-center">
                Rejoignez la marketplace en 3 étapes simples
              </p>
            </div>
            <CardContent className="space-y-4 p-6">
              <div className="flex gap-4 items-start p-4 rounded-lg bg-surface-elevated hover:bg-accent/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent-dark text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1 text-lg">
                    Documents Obligatoires
                  </h4>
                  <p className="text-sm text-text-secondary">
                    SIRET, Attestation d'Assurance Décennale valide
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success border border-success/20">
                      Vérification rapide
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-lg bg-surface-elevated hover:bg-accent/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1 text-lg">
                    Portfolio Vérifié
                  </h4>
                  <p className="text-sm text-text-secondary">
                    2-3 derniers chantiers réalisés avec photos. Optionnel :
                    contacts clients pour contrôle des avis
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                      Optionnel
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-lg bg-surface-elevated hover:bg-accent/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-success to-success/80 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1 text-lg">
                    Validation & Badge
                  </h4>
                  <p className="text-sm text-text-secondary">
                    Audit IA automatique. Badge "Certifié" délivré en 24-48h
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-xs text-success font-semibold">
                      Certification garantie
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/professionnel/inscription">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white text-lg font-semibold py-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                  >
                    Commencer mon inscription
                  </Button>
                </Link>

                <p className="text-center text-sm text-text-muted mt-4">
                  Gratuit pendant 30 jours • Annulez à tout moment
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <Card
            className="bg-gradient-to-r from-surface-elevated to-surface border-2 border-border animate-slide-up"
            style={{ animationDelay: '0.6s' }}
          >
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-center mb-6">
                Pourquoi nous faire confiance ?
              </h3>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Vérification stricte</h4>
                    <p className="text-sm text-text-secondary">
                      Tous les professionnels sont vérifiés et certifiés
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1 text-purple-700">
                      Paiement séquestré
                    </h4>
                    <p className="text-sm text-text-secondary">
                      Protection des fonds via notre opérateur partenaire.
                      Acompte et travaux sécurisés, déblocage par étapes
                      validées.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Support dédié</h4>
                    <p className="text-sm text-text-secondary">
                      Assistance disponible 7j/7 pour vos questions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Sans engagement</h4>
                    <p className="text-sm text-text-secondary">
                      Résiliez à tout moment sans frais cachés
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
