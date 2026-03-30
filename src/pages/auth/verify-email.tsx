import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const { toast } = useToast();

  useEffect(() => {
    const verifyEmail = async () => {
      const { token_hash, type } = router.query;

      if (!token_hash || typeof token_hash !== "string") {
        setStatus("error");
        return;
      }

      const verificationType = (type as "signup" | "recovery" | "email_change") || "signup";
      const { error } = await authService.confirmEmail(token_hash, verificationType);

      if (error) {
        setStatus("error");
        toast({
          title: "❌ Erreur de vérification",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setStatus("success");
      toast({
        title: "✅ Email vérifié",
        description: "Votre compte a été activé avec succès",
      });

      // Rediriger vers le dashboard approprié après 3 secondes
      setTimeout(() => {
        router.push("/particulier");
      }, 3000);
    };

    if (router.isReady) {
      verifyEmail();
    }
  }, [router, toast]);

  return (
    <>
      <SEO 
        title="Vérification email - SwipeTonPro 2.0"
        description="Vérification de votre adresse email"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
        <Card className="w-full max-w-md shadow-xl text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Vérification de l'email</CardTitle>
            <CardDescription>
              {status === "loading" && "Vérification en cours..."}
              {status === "success" && "Votre email a été vérifié"}
              {status === "error" && "Échec de la vérification"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Veuillez patienter pendant que nous vérifions votre email...
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Email vérifié !</h3>
                  <p className="text-sm text-muted-foreground">
                    Votre compte est maintenant actif. Vous allez être redirigé automatiquement...
                  </p>
                </div>
                <Button
                  onClick={() => router.push("/particulier")}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  Accéder à mon compte
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Échec de la vérification</h3>
                  <p className="text-sm text-muted-foreground">
                    Le lien de vérification est invalide ou a expiré.
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <Button
                    onClick={() => router.push("/")}
                    variant="outline"
                    className="flex-1"
                  >
                    Retour à l'accueil
                  </Button>
                  <Button
                    onClick={() => router.push("/auth/forgot-password")}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    Renvoyer l'email
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}