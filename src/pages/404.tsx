import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();

  return (
    <>
      <SEO 
        title="Page non trouvée - SwipeTonPro" 
        description="La page que vous recherchez n'existe pas. Retournez à l'accueil ou explorez nos services."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface flex items-center justify-center p-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-lg w-full text-center relative z-10">
          {/* 404 Number */}
          <div className="relative mb-8">
            <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              404
            </h1>
            <div className="absolute inset-0 text-9xl font-black text-primary/10 blur-sm -z-10 translate-y-2">
              404
            </div>
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Page introuvable
          </h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            La page que vous recherchez semble avoir disparu ou n&apos;a jamais existé. 
            Pas de panique, nous vous aidons à retrouver votre chemin !
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => router.back()} 
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            
            <Link href="/" passHref>
              <Button className="gap-2 gradient-accent text-white">
                <Home className="w-4 h-4" />
                Accueil
              </Button>
            </Link>
            
            <Link href="/particulier/diagnostic" passHref>
              <Button variant="outline" className="gap-2">
                <Search className="w-4 h-4" />
                Diagnostic
              </Button>
            </Link>
          </div>

          {/* Help links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-text-secondary mb-4">
              Besoin d&apos;aide ?
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link href="/faq" className="text-accent hover:underline">
                FAQ
              </Link>
              <span className="text-border">•</span>
              <Link href="/contact" className="text-accent hover:underline">
                Contact
              </Link>
              <span className="text-border">•</span>
              <Link href="/professionnel" className="text-accent hover:underline">
                Espace Pro
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
