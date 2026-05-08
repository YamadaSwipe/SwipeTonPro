import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  Euro,
  Calendar,
  MapPin,
  Building,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EtapePaiement {
  label: string;
  pourcentage: number;
  condition: string;
  montant: number;
}

interface AccordFormData {
  nom_client: string;
  adresse_travaux: string;
  nom_entreprise: string;
  siret_pro: string;
  nature_travaux: string;
  date_debut: string;
  duree_travaux: string;
  total_projet: number;
  etapes: EtapePaiement[];
}

export default function AccordMutuelPage() {
  const router = useRouter();
  const { projectId } = router.query;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [professional, setProfessional] = useState<any>(null);
  const [accordGenerated, setAccordGenerated] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState<AccordFormData>({
    nom_client: '',
    adresse_travaux: '',
    nom_entreprise: '',
    siret_pro: '',
    nature_travaux: '',
    date_debut: '',
    duree_travaux: '',
    total_projet: 0,
    etapes: [
      {
        label: 'Signature accord',
        pourcentage: 10,
        condition: 'Signature du contrat',
        montant: 0,
      },
      {
        label: 'Début chantier',
        pourcentage: 30,
        condition: 'Démarrage effectif des travaux',
        montant: 0,
      },
      {
        label: 'Mi-parcours',
        pourcentage: 30,
        condition: 'Achievement de 50% des travaux',
        montant: 0,
      },
      {
        label: 'Fin chantier',
        pourcentage: 30,
        condition: 'Réception finale des travaux',
        montant: 0,
      },
    ],
  });

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  useEffect(() => {
    // Recalculer les montants quand le total ou les pourcentages changent
    const updatedEtapes = formData.etapes.map((etape) => ({
      ...etape,
      montant: Math.round((formData.total_projet * etape.pourcentage) / 100),
    }));

    const totalPourcentage = updatedEtapes.reduce(
      (sum, etape) => sum + etape.pourcentage,
      0
    );

    if (totalPourcentage !== 100 && formData.total_projet > 0) {
      // Ajuster la dernière étape pour atteindre 100%
      const diff = 100 - totalPourcentage;
      if (updatedEtapes.length > 0) {
        updatedEtapes[updatedEtapes.length - 1].pourcentage += diff;
        updatedEtapes[updatedEtapes.length - 1].montant = Math.round(
          (formData.total_projet *
            updatedEtapes[updatedEtapes.length - 1].pourcentage) /
            100
        );
      }
    }

    setFormData((prev) => ({ ...prev, etapes: updatedEtapes }));
  }, [formData.total_projet]);

  const loadProjectData = async () => {
    try {
      const projectIdStr = Array.isArray(projectId) ? projectId[0] : projectId;
      if (!projectIdStr) return;

      // Charger le projet
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectIdStr)
        .single();

      if (projectError || !projectData) {
        toast({
          title: 'Erreur',
          description: 'Projet non trouvé',
          variant: 'destructive',
        });
        return;
      }

      setProject(projectData);

      // Charger le profil du client
      const { data: clientData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', projectData.client_id)
        .single();

      // Charger le professionnel matché
      const { data: matchData } = await supabase
        .from('matches')
        .select('professional_id')
        .eq('project_id', projectIdStr)
        .eq('status', 'accepted')
        .single();

      if (matchData) {
        const { data: professionalData } = await supabase
          .from('professionals')
          .select('company_name, siret')
          .eq('id', matchData.professional_id)
          .single();

        setProfessional(professionalData);

        // Pré-remplir le formulaire
        setFormData((prev) => ({
          ...prev,
          nom_client: clientData?.full_name || '',
          adresse_travaux: `${projectData.address}, ${projectData.postal_code} ${projectData.city}`,
          nom_entreprise: professionalData?.company_name || '',
          siret_pro: professionalData?.siret || '',
          nature_travaux: Array.isArray(projectData.work_type)
            ? projectData.work_type.join(', ')
            : projectData.work_type || projectData.description || '',
          total_projet:
            projectData.budget_max || projectData.estimated_budget_max || 0,
        }));
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du projet',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addEtape = () => {
    setFormData((prev) => ({
      ...prev,
      etapes: [
        ...prev.etapes,
        {
          label: `Étape ${prev.etapes.length + 1}`,
          pourcentage: 10,
          condition: 'À définir',
          montant: Math.round((prev.total_projet * 10) / 100),
        },
      ],
    }));
  };

  const removeEtape = (index: number) => {
    if (formData.etapes.length > 1) {
      setFormData((prev) => ({
        ...prev,
        etapes: prev.etapes.filter((_, i) => i !== index),
      }));
    }
  };

  const updateEtape = (
    index: number,
    field: keyof EtapePaiement,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      etapes: prev.etapes.map((etape, i) =>
        i === index ? { ...etape, [field]: value } : etape
      ),
    }));
  };

  const generatePDF = async () => {
    setSubmitting(true);

    try {
      const response = await fetch('/api/generate-accord-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          formData,
          date_signature: new Date().toLocaleDateString('fr-FR'),
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }

      const result = await response.json();

      // Mettre à jour le projet avec l'URL du PDF
      await supabase
        .from('projects')
        .update({
          accord_pdf_url: result.pdfUrl,
          accord_generated_at: new Date().toISOString(),
          accord_status: 'generated',
        })
        .eq('id', projectId);

      setAccordGenerated(true);

      toast({
        title: 'Succès',
        description: "L'accord mutuel a été généré avec succès",
      });
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast({
        title: 'Erreur',
        description: "Impossible de générer l'accord PDF",
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await fetch(
        `/api/download-accord-pdf?projectId=${projectId}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accord-mutuel-${projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le PDF',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO title="Accord Mutuel - EDSwipe" />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link href="/particulier/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">
                  Accord Mutuel
                </h1>
              </div>
              {accordGenerated && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Accord généré
                  </Badge>
                  <Button size="sm" onClick={downloadPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Formulaire */}
            <div className="space-y-6">
              {/* Informations du projet */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Informations du contrat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nom_client">Nom du client</Label>
                      <Input
                        id="nom_client"
                        value={formData.nom_client}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nom_client: e.target.value,
                          }))
                        }
                        placeholder="Nom complet du client"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nom_entreprise">
                        Nom de l'entreprise
                      </Label>
                      <Input
                        id="nom_entreprise"
                        value={formData.nom_entreprise}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            nom_entreprise: e.target.value,
                          }))
                        }
                        placeholder="Nom de l'entreprise artisan"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="adresse_travaux">Adresse du chantier</Label>
                    <Input
                      id="adresse_travaux"
                      value={formData.adresse_travaux}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          adresse_travaux: e.target.value,
                        }))
                      }
                      placeholder="Adresse complète du chantier"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="siret_pro">SIRET de l'artisan</Label>
                      <Input
                        id="siret_pro"
                        value={formData.siret_pro}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            siret_pro: e.target.value,
                          }))
                        }
                        placeholder="Numéro SIRET"
                      />
                    </div>
                    <div>
                      <Label htmlFor="total_projet">
                        Montant total du projet (€)
                      </Label>
                      <Input
                        id="total_projet"
                        type="number"
                        value={formData.total_projet}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            total_projet: parseInt(e.target.value) || 0,
                          }))
                        }
                        placeholder="Montant total TTC"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="nature_travaux">Nature des travaux</Label>
                    <Textarea
                      id="nature_travaux"
                      value={formData.nature_travaux}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nature_travaux: e.target.value,
                        }))
                      }
                      placeholder="Description détaillée des travaux à réaliser"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date_debut">Date de début prévue</Label>
                      <Input
                        id="date_debut"
                        type="date"
                        value={formData.date_debut}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            date_debut: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="duree_travaux">Durée estimée</Label>
                      <Input
                        id="duree_travaux"
                        value={formData.duree_travaux}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            duree_travaux: e.target.value,
                          }))
                        }
                        placeholder="Ex: 2 semaines, 1 mois..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Échéancier de paiement */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Euro className="w-5 h-5 mr-2" />
                      Échéancier de paiement séquestre
                    </CardTitle>
                    <Button size="sm" onClick={addEtape}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {formData.etapes.map((etape, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                            <Input
                              value={etape.label}
                              onChange={(e) =>
                                updateEtape(index, 'label', e.target.value)
                              }
                              placeholder="Libellé de l'étape"
                              className="text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <div className="relative">
                              <Input
                                type="number"
                                value={etape.pourcentage}
                                onChange={(e) =>
                                  updateEtape(
                                    index,
                                    'pourcentage',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                placeholder="%"
                                className="text-sm pr-8"
                              />
                              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                %
                              </span>
                            </div>
                          </div>
                          <div className="col-span-3">
                            <Input
                              value={etape.condition}
                              onChange={(e) =>
                                updateEtape(index, 'condition', e.target.value)
                              }
                              placeholder="Condition"
                              className="text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={etape.montant}
                              readOnly
                              className="text-sm bg-white"
                              placeholder="Montant"
                            />
                          </div>
                          <div className="col-span-1">
                            {formData.etapes.length > 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeEtape(index)}
                                className="w-full"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Total :{' '}
                      <strong>
                        {formData.etapes.reduce(
                          (sum, e) => sum + e.pourcentage,
                          0
                        )}
                        %
                      </strong>
                      (
                      {formData.etapes
                        .reduce((sum, e) => sum + e.montant, 0)
                        .toLocaleString()}
                      €)
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {previewMode ? 'Masquer' : 'Prévisualiser'}
                </Button>
                {!accordGenerated && (
                  <Button
                    onClick={generatePDF}
                    disabled={
                      submitting ||
                      !formData.nom_client ||
                      !formData.nom_entreprise ||
                      formData.total_projet === 0
                    }
                  >
                    {submitting ? 'Génération...' : 'Générer le PDF'}
                  </Button>
                )}
              </div>
            </div>

            {/* Prévisualisation */}
            {previewMode && (
              <div className="lg:sticky lg:top-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Prévisualisation du contrat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="border rounded-lg p-4 bg-white"
                      style={{ fontSize: '12px', lineHeight: '1.2' }}
                      dangerouslySetInnerHTML={{
                        __html: generateContractHTML(
                          formData,
                          new Date().toLocaleDateString('fr-FR')
                        ),
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function generateContractHTML(
  data: AccordFormData,
  dateSignature: string
): string {
  const etapesHTML = data.etapes
    .map(
      (etape) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${etape.label}</td>
      <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${etape.pourcentage}%</td>
      <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${etape.condition}</td>
      <td style="border: 1px solid #ddd; padding: 4px; font-size: 10px;">${etape.montant} €</td>
    </tr>
  `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <div style="text-align: center; border-bottom: 2px solid #0052cc; padding-bottom: 10px; margin-bottom: 15px;">
        <h1 style="color: #0052cc; margin: 0; font-size: 16px;">SWIPE TON PRO</h1>
        <div style="display: inline-block; background: #e6f0ff; color: #0052cc; padding: 3px 10px; border-radius: 10px; font-weight: bold; margin-top: 5px; font-size: 10px;">
          ACCORD DE RÉALISATION & SÉQUESTRE STRIPE
        </div>
      </div>

      <h2 style="text-align: center; text-transform: uppercase; font-size: 12px;">Accord Mutuel et Plan de Paiement</h2>

      <div style="background: #f9f9f9; padding: 8px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #eee;">
        <h3 style="color: #0052cc; border-bottom: 1px solid #0052cc; font-size: 10px; text-transform: uppercase;">1. Les Parties</h3>
        <p style="font-size: 10px;"><strong>LE CLIENT :</strong> ${data.nom_client} <br> <strong>Adresse du chantier :</strong> ${data.adresse_travaux}</p>
        <p style="font-size: 10px;"><strong>L'ARTISAN :</strong> ${data.nom_entreprise} <br> <strong>SIRET :</strong> ${data.siret_pro} | <strong>Assurance :</strong> Vérifiée par la plateforme</p>
      </div>

      <div style="background: #f9f9f9; padding: 8px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #eee;">
        <h3 style="color: #0052cc; border-bottom: 1px solid #0052cc; font-size: 10px; text-transform: uppercase;">2. Détails de la prestation</h3>
        <p style="font-size: 10px;"><strong>Nature :</strong> ${data.nature_travaux}</p>
        <p style="font-size: 10px;"><strong>Calendrier :</strong> Début prévu le ${data.date_debut} | Durée estimée : ${data.duree_travaux}</p>
      </div>

      <div style="background: #f9f9f9; padding: 8px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #eee;">
        <h3 style="color: #0052cc; border-bottom: 1px solid #0052cc; font-size: 10px; text-transform: uppercase;">3. Échéancier Séquestre (Via Stripe)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 10px;">
          <thead>
            <tr style="background: #eee;">
              <th style="border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 9px;">Étape</th>
              <th style="border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 9px;">%</th>
              <th style="border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 9px;">Condition</th>
              <th style="border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 9px;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${etapesHTML}
          </tbody>
        </table>
        <p style="text-align: right; font-weight: bold; font-size: 12px; margin-top: 5px;">TOTAL TTC : ${data.total_projet.toLocaleString()} €</p>
      </div>

      <div style="font-size: 8px; color: #666; margin-top: 15px; border: 1px dashed #ccc; padding: 5px;">
        <strong>NOTE JURIDIQUE :</strong> Swipe Ton Pro est un intermédiaire technique. Les fonds sont gérés par Stripe. La plateforme décline toute responsabilité quant à l'exécution technique des travaux. Ce document vaut contrat entre les parties.
      </div>

      <div style="margin-top: 25px; display: flex; justify-content: space-between;">
        <div style="width: 40%; border-top: 1px solid #000; padding-top: 5px;">
          <strong style="font-size: 9px;">Signature Client</strong><br>
          <small style="font-size: 7px;">Signé numériquement le ${dateSignature}</small>
        </div>
        <div style="width: 40%; border-top: 1px solid #000; padding-top: 5px; text-align: right;">
          <strong style="font-size: 9px;">Signature Artisan</strong><br>
          <small style="font-size: 7px;">Signé numériquement le ${dateSignature}</small>
        </div>
      </div>
    </div>
  `;
}
