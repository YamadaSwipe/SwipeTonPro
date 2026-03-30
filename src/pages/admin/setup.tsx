import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminSetup() {
  const [email, setEmail] = useState("admin@swipetonpro.fr");
  const [password, setPassword] = useState("Red1980");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const router = useRouter();

  const addDebugInfo = (info: string) => {
    console.log("🔍 DEBUG:", info);
    setDebugInfo(prev => [...prev, info]);
  };

  const handleCreateSuperAdmin = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    setDebugInfo([]);

    try {
      addDebugInfo("Démarrage de la création du compte Super Admin...");
      addDebugInfo("Appel de l'API de création...");

      // Appeler l'API route qui a les privilèges SERVICE_ROLE
      const response = await fetch("/api/admin/create-super-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: "swipetonpro-setup-2026" // Secret pour sécuriser l'endpoint
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du compte");
      }

      addDebugInfo(`✅ Compte créé avec succès! ID: ${data.userId}`);
      addDebugInfo("🎉 Super Admin configuré!");
      
      setSuccess(true);
      setError("");
      
      // Redirection automatique après 3 secondes
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);

    } catch (err: any) {
      console.error("❌ Erreur:", err);
      addDebugInfo(`❌ ERREUR: ${err.message}`);
      setError(err.message);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-orange-200">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">
            Configuration Super Admin
          </CardTitle>
          <CardDescription className="text-lg text-slate-600">
            Créez votre compte administrateur principal pour gérer la plateforme SwipeTonPro
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!success ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-semibold">
                    Email administrateur
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@swipetonpro.fr"
                    className="h-12 text-base"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-base font-semibold">
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe sécurisé"
                    className="h-12 text-base"
                    disabled={loading}
                  />
                  <p className="text-sm text-slate-500">
                    Minimum 6 caractères - Vous pourrez le changer après connexion
                  </p>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-base font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {debugInfo.length > 0 && (
                <Alert className="border-2 border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="text-sm font-mono text-blue-900 space-y-1">
                    <div className="font-bold mb-2">📊 Logs de création :</div>
                    {debugInfo.map((info, idx) => (
                      <div key={idx} className="text-xs">{info}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCreateSuperAdmin}
                disabled={loading || !email || !password || password.length < 6}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-6 w-6" />
                    Créer le compte Super Admin
                  </>
                )}
              </Button>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Important
                </h3>
                <ul className="text-sm text-blue-800 space-y-2 ml-7">
                  <li>• Un email de confirmation sera envoyé (vérifiez aussi les spams)</li>
                  <li>• Cliquez sur le lien dans l'email pour activer votre compte</li>
                  <li>• Ouvrez la console (F12) pour voir les logs détaillés</li>
                  <li>• Le compte aura tous les privilèges administrateur</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <Alert className="border-2 border-green-500 bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <AlertDescription className="text-base font-medium text-green-900 mt-2">
                  🎉 <strong>Compte Super Admin créé avec succès !</strong>
                </AlertDescription>
              </Alert>

              {debugInfo.length > 0 && (
                <Alert className="border-2 border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="text-sm font-mono text-blue-900 space-y-1">
                    <div className="font-bold mb-2">📊 Logs de création :</div>
                    {debugInfo.map((info, idx) => (
                      <div key={idx} className="text-xs">{info}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4 bg-slate-50 rounded-lg p-6 border-2 border-slate-200">
                <h3 className="font-bold text-xl text-slate-900">📧 Prochaines étapes :</h3>
                <ol className="space-y-3 text-slate-700">
                  <li className="flex gap-3">
                    <span className="font-bold text-orange-600 text-lg">1.</span>
                    <span className="text-base">
                      <strong>Vérifiez votre boîte email</strong> ({email})
                      <br />
                      <span className="text-sm text-slate-500">(Vérifiez aussi vos spams et l'onglet "Promotions")</span>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-orange-600 text-lg">2.</span>
                    <span className="text-base">
                      <strong>Cliquez sur le lien de confirmation</strong> dans l'email reçu
                      <br />
                      <span className="text-sm text-slate-500">Sujet: "Confirm your signup" ou "Confirmez votre inscription"</span>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-orange-600 text-lg">3.</span>
                    <span className="text-base">
                      <strong>Connectez-vous</strong> sur <code className="bg-slate-200 px-2 py-1 rounded">/auth/login</code>
                      <br />
                      <span className="text-sm text-slate-500">Email: {email} | Mot de passe: {password}</span>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-orange-600 text-lg">4.</span>
                    <span className="text-base">
                      <strong>Accédez au dashboard admin</strong> (redirection automatique après connexion)
                    </span>
                  </li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => window.location.href = "/auth/login"}
                  className="flex-1 h-12 text-base bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  Aller à la page de connexion
                </Button>
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                    setPassword("");
                    setDebugInfo([]);
                  }}
                  variant="outline"
                  className="flex-1 h-12 text-base border-2"
                >
                  Créer un autre admin
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}