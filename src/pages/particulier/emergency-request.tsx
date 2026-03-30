import { SEO } from "@/components/SEO";
import { useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import EmergencyProjectForm from "@/components/EmergencyProjectForm";
import { ArrowLeft, AlertTriangle, Phone, Shield, Clock } from "lucide-react";
import Link from "next/link";

export default function EmergencyRequestPage() {
  const router = useRouter();
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const handleSuccess = (id: string) => {
    setProjectId(id);
    setRequestSubmitted(true);
  };

  if (requestSubmitted && projectId) {
    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <SEO title="Demande d'urgence envoyée | SwipeTonPro" />
        
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <Link href="/particulier/dashboard">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au dashboard
                </Button>
              </Link>
            </div>

            {/* Confirmation */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-green-800 text-2xl">
                  🚨 Demande d'urgence envoyée !
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <Alert className="border-green-200 bg-green-100">
                  <AlertTriangle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    <strong>Les professionnels qualifiés sont notifiés immédiatement</strong> et vous contacteront dans les plus brefs délais.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <Phone className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <h3 className="font-semibold mb-1">Restez disponible</h3>
                    <p className="text-sm text-gray-600">Gardez votre téléphone à portée de main</p>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg">
                    <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold mb-1">Intervention rapide</h3>
                    <p className="text-sm text-gray-600">Les professionnels interviennent 24h/24, 7j/7</p>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg">
                    <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold mb-1">Professionnels vérifiés</h3>
                    <p className="text-sm text-gray-600">Qualifiés et assurés pour votre sécurité</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href={`/particulier/projects/${projectId}`} className="flex-1">
                    <Button className="w-full">
                      Suivre ma demande
                    </Button>
                  </Link>
                  
                  <Link href="/particulier/dashboard" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Retour au dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <SEO title="Demande d'urgence | SwipeTonPro" />
      
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/particulier/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Demande d'Intervention d'Urgence
                </h1>
                <p className="text-sm text-muted-foreground">
                  Service disponible 24h/24 et 7j/7
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <Phone className="w-4 h-4" />
                <span>Urgence : Appelez le 09 XX XX XX XX</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Alertes importantes */}
          <div className="mb-8 space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>Attention :</strong> Ce service est réservé aux situations d'urgence réelles nécessitant une intervention immédiate.
                Une majoration de 50% est appliquée pour garantir l'intervention rapide des professionnels.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-red-600 mb-2">🚨 Situations d'urgence</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Fuite d'eau importante</li>
                  <li>• Panne électrique totale</li>
                  <li>• Problème de chauffage en hiver</li>
                  <li>• Fuite de gaz</li>
                  <li>• Dégât des eaux</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-orange-600 mb-2">⚡ Intervention rapide</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Notification immédiate aux pros</li>
                  <li>• Intervention sous 2-4h</li>
                  <li>• Disponible 24h/24, 7j/7</li>
                  <li>• Suivi en temps réel</li>
                  <li>• Professionnels qualifiés</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-blue-600 mb-2">💰 Tarification</h3>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Majoration de 50%</li>
                  <li>• Devis validé avant intervention</li>
                  <li>• Paiement sécurisé</li>
                  <li>• Facture détaillée</li>
                  <li>• Assurance professionnelle</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Formulaire d'urgence */}
          <EmergencyProjectForm onSuccess={handleSuccess} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
