import { SEO } from "@/components/SEO";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "❌ Erreur",
        description: "Veuillez entrer votre adresse email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await authService.resetPassword(email);

    if (error) {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setEmailSent(true);
    setLoading(false);
    
    toast({
      title: "✅ Email envoyé",
      description: "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe",
    });
  }

  return (
    <>
      <SEO 
        title="Mot de passe oublié - SwipeTonPro 2.0"
        description="Réinitialisez votre mot de passe SwipeTonPro"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
            <CardTitle className="text-2xl font-bold">Mot de passe oublié ?</CardTitle>
            <CardDescription>
              Entrez votre adresse email pour recevoir un lien de réinitialisation
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  disabled={loading}
                >
                  {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Vous vous souvenez de votre mot de passe ?{" "}
                  <Link href="/particulier" className="text-orange-600 hover:underline font-medium">
                    Se connecter
                  </Link>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Email envoyé !</h3>
                  <p className="text-sm text-muted-foreground">
                    Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vérifiez également votre dossier spam si vous ne le trouvez pas.
                  </p>
                </div>
                
                <Button
                  onClick={() => setEmailSent(false)}
                  variant="outline"
                  className="w-full"
                >
                  Renvoyer l'email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}