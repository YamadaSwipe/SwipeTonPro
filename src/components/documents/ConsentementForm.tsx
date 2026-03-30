import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Save, 
  CheckCircle,
  DollarSign,
  Shield,
  Users,
  Building,
  Mail,
  Phone
} from 'lucide-react';
import { TarifService } from '@/services/tarifService';
import { DocumentService } from '@/services/documentService';

interface ConsentementData {
  projetId: string;
  projetInfo: {
    titre: string;
    description: string;
    localisation: string;
  };
  budgetTotal: number;
  fraisSwipeTonPro: number;
  montantReelTravaux: number;
  optionsFrais: 'partage' | 'client' | 'artisan';
  montantArtisan: number;
  montantClient: number;
  particulierInfo: {
    nom: string;
    adresse: string;
    email: string;
    telephone: string;
  };
  professionnelInfo: {
    nom: string;
    entreprise: string;
    formeJuridique: string;
    siret: string;
    adresse: string;
    email: string;
    telephone: string;
  };
  optionsSecurisation: {
    acompte: boolean;
    total: boolean;
    paliers: boolean;
  };
  modeVersement: 'unique' | 'paliers';
  paliersVersement: {
    signature: number;
    debutChantier: number;
    milieuChantier: number;
    receptionFin: number;
    finChantier: number;
  };
}

interface ConsentementFormProps {
  projetId: string;
  projetData?: any;
  onSave?: (data: ConsentementData) => void;
}

const ConsentementForm: React.FC<ConsentementFormProps> = ({ 
  projetId, 
  projetData,
  onSave 
}) => {
  const [formData, setFormData] = useState<ConsentementData>({
    projetId,
    projetInfo: {
      titre: '',
      description: '',
      localisation: ''
    },
    budgetTotal: 10000,
    fraisSwipeTonPro: 0,
    montantReelTravaux: 0,
    optionsFrais: 'artisan',
    montantArtisan: 0,
    montantClient: 0,
    particulierInfo: {
      nom: '',
      adresse: '',
      email: '',
      telephone: ''
    },
    professionnelInfo: {
      nom: '',
      entreprise: '',
      formeJuridique: '',
      siret: '',
      adresse: '',
      email: '',
      telephone: ''
    },
    optionsSecurisation: {
      acompte: false,
      total: false,
      paliers: false
    },
    modeVersement: 'unique',
    paliersVersement: {
      signature: 0,
      debutChantier: 0,
      milieuChantier: 0,
      receptionFin: 0,
      finChantier: 0
    }
  });

  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    // Calcul automatique des frais et montant réel
    const frais = formData.budgetTotal * 0.033; // 3,3%
    const montantReel = formData.budgetTotal - frais;
    
    setFormData(prev => ({
      ...prev,
      fraisSwipeTonPro: frais,
      montantReelTravaux: montantReel
    }));

    // Pré-remplir avec les données du projet si disponibles
    if (projetData) {
      setFormData(prev => ({
        ...prev,
        projetInfo: {
          titre: projetData.titre || prev.projetInfo.titre,
          description: projetData.description || prev.projetInfo.description,
          localisation: projetData.localisation || prev.projetInfo.localisation
        },
        budgetTotal: projetData.budget || prev.budgetTotal,
        particulierInfo: projetData.client ? {
          ...prev.particulierInfo,
          nom: projetData.client.full_name || prev.particulierInfo.nom,
          email: projetData.client.email || prev.particulierInfo.email
        } : prev.particulierInfo,
        professionnelInfo: projetData.professional ? {
          ...prev.professionnelInfo,
          nom: projetData.professional.full_name || prev.professionnelInfo.nom,
          entreprise: projetData.professional.company_name || prev.professionnelInfo.entreprise,
          email: projetData.professional.email || prev.professionnelInfo.email
        } : prev.professionnelInfo
      }));
    }
  }, [formData.budgetTotal, projetData]);

  const getMontantArtisan = () => {
    switch (formData.optionsFrais) {
      case 'artisan':
        return formData.montantReelTravaux;
      case 'partage':
        return formData.montantReelTravaux + (formData.fraisSwipeTonPro / 2);
      case 'client':
        return formData.budgetTotal;
      default:
        return formData.montantReelTravaux;
    }
  };

  const getMontantClient = () => {
    switch (formData.optionsFrais) {
      case 'artisan':
        return formData.budgetTotal;
      case 'partage':
        return formData.budgetTotal + (formData.fraisSwipeTonPro / 2);
      case 'client':
        return formData.budgetTotal + formData.fraisSwipeTonPro;
      default:
        return formData.budgetTotal;
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setLoading(true);
      
      const pdfBlob = await DocumentService.generateConsentementPDF(formData);
      const fileName = `consentement-${projetId}-${Date.now()}.pdf`;
      
      // Télécharger le PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setGenerated(true);
      
      // Sauvegarder dans Supabase Storage
      await DocumentService.saveDocument(projetId, pdfBlob);
      
      if (onSave) {
        onSave(formData);
      }
    } catch (error) {
      console.error('Erreur génération PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const templateData = {
        ...formData,
        projetInfo: {
          titre: '[Titre du projet]',
          description: '[Description du projet]',
          localisation: '[Localisation du chantier]'
        },
        particulierInfo: {
          nom: '[Nom du particulier]',
          adresse: '[Adresse complète]',
          email: '[Email]',
          telephone: '[Téléphone]'
        },
        professionnelInfo: {
          nom: '[Nom du professionnel]',
          entreprise: '[Nom de l\'entreprise]',
          formeJuridique: '[Forme juridique]',
          siret: '[SIRET]',
          adresse: '[Adresse entreprise]',
          email: '[Email]',
          telephone: '[Téléphone]'
        }
      };

      const pdfBlob = await DocumentService.generateConsentementPDF(templateData);
      
      // Télécharger le modèle
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modele-consentement.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement modèle:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document de consentement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Générez le document de consentement pour sécuriser les fonds et formaliser les modalités de paiement.
          </p>
        </CardContent>
      </Card>

      {/* Informations du projet */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du projet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Titre du projet</Label>
              <Input 
                value={formData.projetInfo.titre}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  projetInfo: { ...prev.projetInfo, titre: e.target.value }
                }))}
                placeholder="Titre du projet"
              />
            </div>
            <div>
              <Label>Budget total (frais comprises)</Label>
              <Input 
                type="number" 
                value={formData.budgetTotal}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  budgetTotal: parseFloat(e.target.value) || 0 
                }))}
                placeholder="0.00"
              />
              <p className="text-sm text-gray-500 mt-1">
                Ce montant inclut déjà les frais de sécurisation
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Description</Label>
              <Input 
                value={formData.projetInfo.description}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  projetInfo: { ...prev.projetInfo, description: e.target.value }
                }))}
                placeholder="Description du projet"
              />
            </div>
            <div>
              <Label>Localisation</Label>
              <Input 
                value={formData.projetInfo.localisation}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  projetInfo: { ...prev.projetInfo, localisation: e.target.value }
                }))}
                placeholder="Adresse du chantier"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frais SwipeTonPro (3,3%)</Label>
              <Input 
                type="number" 
                value={formData.fraisSwipeTonPro} 
                readOnly 
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Montant réel des travaux</Label>
              <Input 
                type="number" 
                value={formData.montantReelTravaux} 
                readOnly 
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parties concernées */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Particulier client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nom complet</Label>
              <Input 
                value={formData.particulierInfo.nom}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  particulierInfo: { ...prev.particulierInfo, nom: e.target.value }
                }))}
                placeholder="Nom du particulier"
              />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input 
                value={formData.particulierInfo.adresse}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  particulierInfo: { ...prev.particulierInfo, adresse: e.target.value }
                }))}
                placeholder="Adresse complète"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.particulierInfo.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    particulierInfo: { ...prev.particulierInfo, email: e.target.value }
                  }))}
                  placeholder="Email"
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input 
                  value={formData.particulierInfo.telephone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    particulierInfo: { ...prev.particulierInfo, telephone: e.target.value }
                  }))}
                  placeholder="Téléphone"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Professionnel / Gérant société
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nom complet</Label>
              <Input 
                value={formData.professionnelInfo.nom}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  professionnelInfo: { ...prev.professionnelInfo, nom: e.target.value }
                }))}
                placeholder="Nom du professionnel"
              />
            </div>
            <div>
              <Label>Nom de l'entreprise</Label>
              <Input 
                value={formData.professionnelInfo.entreprise}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  professionnelInfo: { ...prev.professionnelInfo, entreprise: e.target.value }
                }))}
                placeholder="Nom de l'entreprise"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Forme juridique</Label>
                <Input 
                  value={formData.professionnelInfo.formeJuridique}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    professionnelInfo: { ...prev.professionnelInfo, formeJuridique: e.target.value }
                  }))}
                  placeholder="SASU/EURL/SARL/etc"
                />
              </div>
              <div>
                <Label>SIRET</Label>
                <Input 
                  value={formData.professionnelInfo.siret}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    professionnelInfo: { ...prev.professionnelInfo, siret: e.target.value }
                  }))}
                  placeholder="SIRET"
                />
              </div>
            </div>
            <div>
              <Label>Adresse</Label>
              <Input 
                value={formData.professionnelInfo.adresse}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  professionnelInfo: { ...prev.professionnelInfo, adresse: e.target.value }
                }))}
                placeholder="Adresse entreprise"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.professionnelInfo.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    professionnelInfo: { ...prev.professionnelInfo, email: e.target.value }
                  }))}
                  placeholder="Email"
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input 
                  value={formData.professionnelInfo.telephone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    professionnelInfo: { ...prev.professionnelInfo, telephone: e.target.value }
                  }))}
                  placeholder="Téléphone"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Options de frais */}
      <Card>
        <CardHeader>
          <CardTitle>Options de répartition des frais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Frais : 3,3%
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Ces frais couvrent :
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Sécurisation du paiement</li>
              <li>• Gestion des versements</li>
              <li>• Protection client et artisan</li>
            </ul>
          </div>

          <div>
            <Label>Options de répartition des frais :</Label>
            <RadioGroup 
              value={formData.optionsFrais}
              onValueChange={(value: 'partage' | 'client' | 'artisan') => 
                setFormData(prev => ({ ...prev, optionsFrais: value }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partage" id="partage" />
                <Label htmlFor="partage">
                  Frais partagés (50% client / 50% artisan)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="client" />
                <Label htmlFor="client">
                  Frais pris en charge par le client
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="artisan" id="artisan" />
                <Label htmlFor="artisan">
                  Frais offerts par l'artisan
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Résumé des montants */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Répartition des montants</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded">
                <p className="font-medium text-green-800">L'artisan reçoit</p>
                <p className="text-xl font-bold text-green-600">
                  {getMontantArtisan().toLocaleString('fr-FR')} €
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {formData.optionsFrais === 'artisan' 
                    ? '(absorbe la totalité des frais)' 
                    : formData.optionsFrais === 'partage'
                    ? '(partage des frais)'
                    : '(aucun frais)'
                  }
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-medium text-blue-800">Le client paie</p>
                <p className="text-xl font-bold text-blue-600">
                  {getMontantClient().toLocaleString('fr-FR')} €
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {formData.optionsFrais === 'artisan'
                    ? '(budget total)'
                    : formData.optionsFrais === 'partage'
                    ? '(budget + 50% frais)'
                    : '(budget + tous les frais)'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modalités de sécurisation */}
      <Card>
        <CardHeader>
          <CardTitle>Modalités de sécurisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Options de sécurisation (cocher une ou plusieurs) :</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="acompte"
                  checked={formData.optionsSecurisation.acompte}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      optionsSecurisation: {
                        ...prev.optionsSecurisation,
                        acompte: checked as boolean
                      }
                    }))
                  }
                />
                <Label htmlFor="acompte">Acompte uniquement</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="total"
                  checked={formData.optionsSecurisation.total}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      optionsSecurisation: {
                        ...prev.optionsSecurisation,
                        total: checked as boolean
                      }
                    }))
                  }
                />
                <Label htmlFor="total">Totalité du projet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="paliers"
                  checked={formData.optionsSecurisation.paliers}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      optionsSecurisation: {
                        ...prev.optionsSecurisation,
                        paliers: checked as boolean
                      }
                    }))
                  }
                />
                <Label htmlFor="paliers">Versement par paliers</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Mode de versement :</Label>
            <RadioGroup 
              value={formData.modeVersement}
              onValueChange={(value: 'unique' | 'paliers') => 
                setFormData(prev => ({ ...prev, modeVersement: value }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unique" id="unique" />
                <Label htmlFor="unique">Versement en une seule fois</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paliers" id="paliers" />
                <Label htmlFor="paliers">Versement par paliers</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Paliers de versement */}
          {(formData.optionsSecurisation.acompte || formData.optionsSecurisation.total || formData.optionsSecurisation.paliers) && (
            <div className="space-y-3">
              <Label>Paliers de versement :</Label>
              
              {formData.optionsSecurisation.acompte && (
                <div className="space-y-2">
                  <h5 className="font-medium">Si acompte uniquement :</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Acompte signature (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.signature}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            signature: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Acompte début chantier (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.debutChantier}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            debutChantier: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(formData.optionsSecurisation.total || formData.optionsSecurisation.paliers) && (
                <div className="space-y-2">
                  <h5 className="font-medium">Si totalité ou par paliers :</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Signature du devis (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.signature}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            signature: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Début chantier (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.debutChantier}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            debutChantier: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Milieu chantier (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.milieuChantier}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            milieuChantier: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Réception fin de chantier (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.receptionFin}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            receptionFin: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Fin de chantier (montant total) (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.finChantier}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            finChantier: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button 
          onClick={handleGeneratePDF}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Génération...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Générer le document
            </>
          )}
        </Button>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Télécharger le modèle
        </Button>
      </div>

      {/* Message de succès */}
      {generated && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-800">
              Document généré avec succès ! Il a été téléchargé et sauvegardé dans votre espace.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentementForm;
