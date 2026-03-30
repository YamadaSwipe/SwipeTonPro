import { useState } from "react";
import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Check, X, Loader2, AlertCircle, ExternalLink } from "lucide-react";

/**
 * Page de configuration SMTP Supabase
 * Permet de configurer automatiquement le SMTP OVH pour les emails d'authentification
 */
export default function SMTPConfigPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    error?: string;
    details?: any;
  } | null>(null);

  async function configureSMTP() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/configure-smtp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "SMTP configuré avec succès !"
        });
      } else {
        setResult({
          success: false,
          message: "Échec de la configuration automatique",
          error: data.error,
          details: data.details
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: "Erreur de connexion",
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SEO 
        title="Configuration SMTP - Admin SwipeTonPro"
        description="Configuration automatique du SMTP Supabase avec OVH"
      />
      
      <AdminLayout title="Configuration SMTP">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-500" />
                Configuration SMTP Supabase
              </CardTitle>
              <CardDescription>
                Configurez automatiquement le SMTP OVH pour les emails d'authentification (inscription, mot de passe oublié)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-orange-900">📧 Paramètres qui seront appliqués :</h3>
                <ul className="space-y-1 text-sm text-orange-800">
                  <li><strong>Host :</strong> ssl0.ovh.net</li>
                  <li><strong>Port :</strong> 465 (SSL/TLS)</li>
                  <li><strong>Username :</strong> noreply@swipetonpro.fr</li>
                  <li><strong>Password :</strong> ••••••••••••••••</li>
                  <li><strong>Sender Email :</strong> noreply@swipetonpro.fr</li>
                  <li><strong>Sender Name :</strong> SwipeTonPro</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Ce que cette configuration fait :</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Configure le SMTP personnalisé dans Supabase Auth</li>
                  <li>Active l'envoi d'emails depuis noreply@swipetonpro.fr</li>
                  <li>Remplace le SMTP par défaut de Supabase (noreply@supabase.io)</li>
                  <li>Permet l'envoi des emails de confirmation, réinitialisation de mot de passe, etc.</li>
                </ul>
              </div>

              <Button
                onClick={configureSMTP}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configuration en cours...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Configurer le SMTP automatiquement
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Résultat */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <X className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <p className="font-semibold">{result.message}</p>
                    {result.error && (
                      <p className="text-sm mt-2">{result.error}</p>
                    )}
                    {result.details && (
                      <pre className="text-xs mt-2 p-2 bg-black/5 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Alternative manuelle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Configuration manuelle (alternative)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Si la configuration automatique échoue, vous pouvez configurer le SMTP manuellement :
              </p>
              
              <ol className="space-y-2 list-decimal list-inside">
                <li>
                  Accédez au{" "}
                  <a
                    href="https://supabase.com/dashboard/project/qhuvnpmqlucpjdslnfui/settings/auth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-500 hover:text-orange-600 inline-flex items-center gap-1"
                  >
                    Dashboard Supabase
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Sélectionnez votre projet (qhuvnpmqlucpjdslnfui)</li>
                <li>Allez dans Settings (⚙️) → Authentication → SMTP Settings</li>
                <li>Activez "Enable Custom SMTP"</li>
                <li>Remplissez les champs avec les valeurs affichées ci-dessus</li>
                <li>Cliquez sur "Save"</li>
              </ol>

              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => window.open("https://supabase.com/dashboard/project/qhuvnpmqlucpjdslnfui/settings/auth", "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir le Dashboard Supabase
              </Button>
            </CardContent>
          </Card>

          {/* Vérification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">✅ Vérifier la configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Une fois configuré (automatiquement ou manuellement), testez en :</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Créant un nouveau compte utilisateur</li>
                <li>Demandant une réinitialisation de mot de passe</li>
                <li>Vérifiant que les emails partent de noreply@swipetonpro.fr</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}