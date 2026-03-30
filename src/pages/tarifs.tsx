import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Lock,
  Users,
  FileText,
  Settings
} from 'lucide-react';
import { TarifService, Tarif } from '@/services/tarifService';

interface TarifDisplay extends Tarif {
  formattedRange: string;
  formattedFrais: string;
}

const TarifsPage: React.FC = () => {
  const [tarifs, setTarifs] = useState<TarifDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTarifs();
  }, []);

  const loadTarifs = async () => {
    try {
      setLoading(true);
      const data = await TarifService.getAllTarifs();
      
      const formattedTarifs = data.map(tarif => ({
        ...tarif,
        formattedRange: TarifService.formatEstimation(tarif.min_estimation, tarif.max_estimation),
        formattedFrais: tarif.frais === 0 ? 'Gratuit' : TarifService.formatMontant(tarif.frais)
      }));
      
      setTarifs(formattedTarifs);
    } catch (error) {
      console.error('Erreur chargement tarifs:', error);
      setError('Impossible de charger les tarifs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tarifs de mise en relation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Des tarifs transparents et progressifs pour vous mettre en relation avec les meilleurs professionnels
          </p>
        </div>

        {/* Grille tarifaire */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Grille tarifaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">
                      Estimation projet
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">
                      Frais de mise en relation
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tarifs.map((tarif, index) => (
                    <tr key={tarif.id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="py-4 px-4">
                        <span className="font-medium text-gray-900">
                          {tarif.formattedRange}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-bold ${
                          tarif.frais === 0 ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {tarif.formattedFrais}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-600">
                          {tarif.description}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Mentions légales et réglementaires */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Statut d'intermédiaire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Notre statut
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    SwipeTonPro agit en tant qu'intermédiaire
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Nous sommes une plateforme technologique qui facilite la mise en relation 
                    entre particuliers et professionnels. Nous ne sommes pas un établissement 
                    bancaire, ni un organisme de crédit, et n'agissons pas en tant que tel.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Partenaire agréé
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Toutes les transactions financières sont traitées par Stripe, 
                    entreprise agréée et régulée dans l'Union Européenne (licence PSD2).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Protection des fonds
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Les fonds sécurisés via Stripe sont conservés dans un compte séquestre 
                    jusqu'à la validation des conditions de déblocage par les deux parties.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Options de sécurisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Sécurisation des paiements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Options de sécurisation disponibles
                </h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Sécurisation de l'acompte uniquement
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Sécurisation du montant total
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Versement par paliers (signature, début, milieu, fin de chantier)
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">
                  Options de répartition des frais
                </h4>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Frais partagés (50% client / 50% artisan)
                  </li>
                  <li className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Frais pris en charge par le client
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Frais offerts par l'artisan
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Document de consentement */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Document de consentement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    Consentement mutuel obligatoire
                  </h4>
                  <p className="text-yellow-700 mb-4">
                    Pour chaque projet, un document de consentement doit être rempli et signé par les deux parties 
                    pour formaliser les modalités de paiement et de sécurisation des fonds.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-700">
                      <strong>Contenu du document :</strong>
                    </p>
                    <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                      <li>• Informations complètes des deux parties</li>
                      <li>• Détails du projet et budget</li>
                      <li>• Options de répartition des frais choisies</li>
                      <li>• Modalités de sécurisation et paliers de versement</li>
                      <li>• Cadre réglementaire et mentions légales</li>
                      <li>• Signatures des deux parties</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module admin (placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Administration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="text-center">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="font-semibold text-gray-700 mb-2">
                  Module d'administration
                </h4>
                <p className="text-gray-600 mb-4">
                  Les administrateurs peuvent modifier les tarifs et gérer les documents de consentement.
                </p>
                <Button variant="outline" disabled>
                  Accès admin (réservé)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>
            Les tarifs sont susceptibles d'être modifiés par les administrateurs de la plateforme. 
            Les tarifs affichés sont ceux en vigueur au moment de votre consultation.
          </p>
          <p className="mt-2">
            Pour toute question sur nos tarifs ou notre fonctionnement, contactez-nous à 
            <a href="mailto:contact@swipetonpro.fr" className="text-blue-600 hover:underline ml-1">
              contact@swipetonpro.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TarifsPage;
