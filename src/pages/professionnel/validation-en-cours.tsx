import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Clock, Mail, CheckCircle, AlertCircle, Home, LogOut, RefreshCw } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";

export default function ProfessionalValidationPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'pending' | 'verified' | 'rejected' | 'suspended'>('pending');

  // Vérifier le statut de validation toutes les 30 secondes
  useEffect(() => {
    const checkValidationStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: professional } = await supabase
          .from('professionals')
          .select('status')
          .eq('user_id', user.id)
          .single();

        if (professional) {
          setValidationStatus(professional.status);
          
          // Si approuvé, rediriger vers le dashboard
          if (professional.status === 'verified') {
            router.push('/professionnel/dashboard');
          } else if (professional.status === 'rejected') {
            // Si rejeté, rediriger vers une page d'information
            router.push('/professionnel/inscription');
          }
        }
      } catch (error) {
        console.error('Erreur vérification statut:', error);
      }
    };

    // Vérifier immédiatement
    checkValidationStatus();

    // Puis vérifier toutes les 30 secondes
    const interval = setInterval(checkValidationStatus, 30000);

    return () => clearInterval(interval);
  }, [router]);

  // Compte à rebours pour vérification manuelle
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleManualCheck = async () => {
    setIsCheckingStatus(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: professional } = await supabase
        .from('professionals')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (professional) {
        setValidationStatus(professional.status);
        
        if (professional.status === 'verified') {
          router.push('/professionnel/dashboard');
        } else if (professional.status === 'rejected') {
          router.push('/professionnel/inscription');
        }
      }
    } catch (error) {
      console.error('Erreur vérification manuelle:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <>
      <SEO 
        title="Validation en cours - SwipeTonPro"
        description="Votre compte professionnel est en cours de validation par notre équipe."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              validationStatus === 'pending' ? 'bg-gradient-to-r from-primary to-primary/80 animate-pulse' :
              validationStatus === 'verified' ? 'bg-green-500' :
              'bg-red-500'
            }`}>
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-heading font-black text-foreground">
              {validationStatus === 'pending' ? 'Inscription en Validation' :
               validationStatus === 'verified' ? 'Compte Validé!' :
               'Inscription Rejetée'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Message principal */}
            <div className="text-center space-y-3">
              <div className={`flex items-center justify-center gap-2 ${
                validationStatus === 'pending' ? 'text-amber-600' :
                validationStatus === 'verified' ? 'text-green-600' :
                'text-red-600'
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-semibold">
                  {validationStatus === 'pending' ? 'Validation en cours' :
                   validationStatus === 'verified' ? 'Compte approuvé' :
                   'Compte rejeté'}
                </span>
              </div>
              
              <p className="text-muted-foreground">
                {validationStatus === 'pending' 
                  ? "Votre compte professionnel a été soumis à notre équipe d'administration pour validation."
                  : validationStatus === 'verified'
                  ? "Félicitations! Votre compte professionnel a été validé."
                  : "Votre inscription n'a pas été validée. Veuillez contacter le support."
                }
              </p>
              
              {validationStatus === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 mb-1">
                        Délai de validation : 24-48h
                      </p>
                      <p className="text-amber-700">
                        Vous recevrez un email dès que votre compte sera validé. 
                        Nos équipes admin, support et TEAM sont notifiées automatiquement.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Processus de validation */}
            {validationStatus === 'pending' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Processus de validation
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Notification envoyée</p>
                      <p className="text-xs text-muted-foreground">
                        Équipes admin, support et TEAM notifiées
                      </p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Vérification des documents</p>
                      <p className="text-xs text-muted-foreground">
                        Validation par l'équipe d'administration
                      </p>
                    </div>
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg opacity-50">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Activation du compte</p>
                      <p className="text-xs text-muted-foreground">
                        Accès au dashboard professionnel
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t">
              {validationStatus === 'pending' ? (
                <>
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Vérification automatique toutes les 30 secondes</p>
                    <p>Prochaine vérification manuelle dans {countdown}s</p>
                  </div>
                  
                  <Button 
                    onClick={handleManualCheck}
                    disabled={isCheckingStatus || countdown > 0}
                    className="w-full"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                    {isCheckingStatus ? 'Vérification...' : 'Vérifier maintenant'}
                  </Button>
                </>
              ) : validationStatus === 'verified' ? (
                <Link href="/professionnel/dashboard" className="w-full">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Accéder au dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/professionnel/inscription" className="w-full">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Refaire l'inscription
                  </Button>
                </Link>
              )}
              
              <div className="grid grid-cols-1 gap-3">
                <Link href="/" className="w-full">
                  <Button variant="outline" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Retour à l'accueil
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </Button>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p>Pour toute question : contact@swipetonpro.com</p>
              <p>Horaires support : 9h-18h du lundi au vendredi</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
