import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Shield, 
  AlertTriangle,
  AlertCircle,
  Eye,
  Download,
  Mail,
  Phone,
  Building2,
  Calendar,
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Professional = Database["public"]["Tables"]["professionals"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ProfessionalWithProfile extends Professional {
  profile: Profile;
}

export default function AdminProfessionalsValidation() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<string>('');

  useEffect(() => {
    loadProfessionals();
  }, [activeTab]);

  const getDocumentTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'siret': 'SIRET',
      'insurance': 'Assurance',
      'certification': 'Certification',
      'id': 'Pièce d\'identité',
      'portfolio': 'Portfolio',
      'other': 'Autre'
    };
    return types[type] || type;
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-600">Vérifié</Badge>;
      case 'pending': return <Badge variant="outline" className="text-orange-600 border-orange-600">En attente</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejeté</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleVerifyDocument = async (documentId: string, professionalId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ 
          status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", documentId);

      if (error) throw error;
      
      // Recharger les documents
      loadDocuments(professionalId);
    } catch (error) {
      console.error("Erreur validation document:", error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // Supprimer de Supabase Storage
      const { data: doc } = await supabase
        .from("documents")
        .select("file_url")
        .eq("id", documentId)
        .single();

      if (doc?.file_url) {
        // Extraire le chemin du fichier de l'URL
        const filePath = doc.file_url.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('documents')
            .remove([`documents/${selectedProfessional.id}/${filePath}`]);
        }
      }

      // Supprimer de la table documents
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;
      
      // Recharger les documents
      loadDocuments(selectedProfessional.id);
    } catch (error) {
      console.error("Erreur suppression document:", error);
    }
  };

  const handleUploadDocument = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProfessional) return;

    setUploading(true);
    try {
      // Convertir fichier en base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        const response = await fetch('/api/upload-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professionalId: selectedProfessional.id,
            documentType,
            fileName: file.name,
            fileData: base64Data
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Document uploadé:', result);
          // Recharger les documents
          loadDocuments(selectedProfessional.id);
        } else {
          console.error('Erreur upload:', await response.text());
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur upload document:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRejectDocument = async (documentId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .update({ 
          status: "rejected",
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq("id", documentId);

      if (error) throw error;
      
      // Recharger les documents
      if (selectedProfessional) {
        loadDocuments(selectedProfessional.id);
      }
    } catch (error) {
      console.error("Erreur rejet document:", error);
    }
  };

  const loadDocuments = async (professionalId: string) => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Erreur chargement documents:", error);
      setDocuments([]);
    }
  };

  const loadProfessionals = async () => {
    setLoading(true);
    try {
      console.log("Chargement professionnels pour statut:", activeTab);
      
      let query = supabase
        .from("professionals")
        .select(`
          *,
          profile:profiles!professionals_user_id_fkey(
            id,
            email,
            full_name,
            phone,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      // Ne pas filtrer si "all" ou undefined
      if (activeTab && activeTab !== "all" && activeTab !== undefined) {
        console.log("Application filtre statut:", activeTab);
        // Utiliser une approche plus simple pour éviter l'erreur de type
        try {
          const supabaseAny = supabase as any;
          const result = await supabaseAny
            .from("profiles")
            .select("id, email, full_name, phone, created_at")
            .eq("role", "professional")
            .eq("validation_status", activeTab)
            .order("created_at", { ascending: false });
          
          if (result.error) {
            console.error("Erreur chargement professionnels filtrés:", result.error);
            setProfessionals([]);
          } else {
            setProfessionals(result.data || []);
          }
        } catch (err) {
          console.error("Erreur lors de la requête:", err);
          setProfessionals([]);
        }
      } else {
        console.log("Pas de filtre appliqué");
        const { data, error } = await query;
        console.log("Résultat professionnels:", { data, error });

        if (error) {
          console.error("Erreur chargement professionnels:", error);
          setProfessionals([]);
        } else if (!data) {
          console.log("Aucune donnée retournée par Supabase");
          setProfessionals([]);
        } else {
          console.log("Professionnels chargés:", data.length);
          setProfessionals(data);
        }
      }
    } catch (error) {
      console.error("Erreur inattendue:", error);
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (professionalId: string, proEmail?: string, companyName?: string) => {
    if (!window.confirm(`Approuver ${companyName || "ce professionnel"} ?`)) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          validation_status: "verified",
          updated_at: new Date().toISOString()
        })
        .eq("id", professionalId);

      if (error) throw error;

      // Email au pro + update profil
      await fetch('/api/notify-pro-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId,
          action: 'approve',
          proEmail,
          companyName,
        }),
      });
      
      loadProfessionals();
    } catch (error) {
      console.error("Erreur validation:", error);
    }
  };

  const handleSuspend = async (professionalId: string, reason: string, proEmail?: string, companyName?: string) => {
    try {
      const { error } = await supabase
        .from("professionals")
        .update({ 
          status: "suspended",
          suspension_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq("id", professionalId);

      if (error) throw error;

      // Email au pro avec motif
      await fetch('/api/notify-pro-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId,
          action: 'suspend',
          reason,
          proEmail,
          companyName,
        }),
      });
      
      loadProfessionals();
    } catch (error) {
      console.error("Erreur suspension:", error);
    }
  };

  const handleReject = async (professionalId: string, reason: string, proEmail?: string, companyName?: string) => {
    try {
      const { error } = await supabase
        .from("professionals")
        .update({ 
          status: "rejected",
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq("id", professionalId);

      if (error) throw error;

      // Email au pro avec motif
      await fetch('/api/notify-pro-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId,
          action: 'reject',
          reason,
          proEmail,
          companyName,
        }),
      });
      
      loadProfessionals();
    } catch (error) {
      console.error("Erreur rejet:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-600">Approuvé</Badge>;
      case "pending": return <Badge variant="outline" className="text-orange-600 border-orange-600">En attente</Badge>;
      case "verified": return <Badge className="bg-blue-600">Vérifié</Badge>;
      case "rejected": return <Badge variant="destructive">Rejeté</Badge>;
      case "suspended": return <Badge variant="destructive">Suspendu</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStats = () => {
    const pending = professionals.filter(p => p.status === "pending").length;
    const approved = professionals.filter(p => p.status === "approved").length;
    const verified = professionals.filter(p => p.status === "verified").length;
    const rejected = professionals.filter(p => p.status === "rejected").length;
    const suspended = professionals.filter(p => p.status === "suspended").length;
    const total = professionals.length;

    return { pending, approved, verified, rejected, suspended, total };
  };

  const stats = getStats();

  // Extraire nom et prénom du titulaire
const getFullNameParts = (fullName: string | null | undefined) => {
  if (!fullName) return { firstName: '', lastName: '' };
  
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  } else {
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }
};

return (
    <>
      <SEO title="Validation Professionnels - Admin" />
      <AdminLayout title="Validation Professionnels">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">En attente</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approuvés</p>
                    <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Suspendus</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.suspended}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Rejetés</p>
                    <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">En attente ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approuvés ({stats.approved})</TabsTrigger>
              <TabsTrigger value="verified">Vérifiés ({stats.verified})</TabsTrigger>
              <TabsTrigger value="suspended">Suspendus ({stats.suspended})</TabsTrigger>
              <TabsTrigger value="rejected">Rejetés ({stats.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p>Chargement...</p>
                </div>
              ) : professionals.length === 0 ? (
                <div className="text-center py-8">
                  <p>Aucun professionnel trouvé</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {professionals.map((professional) => (
                    <Card key={professional.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-4">
                              <h3 className="text-lg font-semibold">
                                {professional.company_name || "Nom non renseigné"}
                              </h3>
                              {getStatusBadge(professional.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  <span>{professional.profile?.full_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4" />
                                  <span>{professional.profile?.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  <span>{professional.profile?.phone || "Non renseigné"}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4" />
                                  <span>SIRET: {professional.siret}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>Inscrit le {new Date(professional.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4" />
                                  <span>{professional.specialties?.join(", ") || "Aucune spécialité"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProfessional(professional);
                                    loadDocuments(professional.id);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails du professionnel</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-6">
                                  <div>
                                    <h4 className="font-semibold mb-2">Informations entreprise</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      {(() => {
                                        const nameParts = getFullNameParts(professional.profile?.full_name);
                                        return (
                                          <>
                                            <div><strong>Nom titulaire:</strong> {nameParts.lastName || 'Non renseigné'}</div>
                                            <div><strong>Prénom titulaire:</strong> {nameParts.firstName || 'Non renseigné'}</div>
                                            <div><strong>Nom entreprise:</strong> {professional.company_name}</div>
                                            <div><strong>SIRET:</strong> {professional.siret}</div>
                                            <div><strong>Spécialités:</strong> {professional.specialties?.join(", ")}</div>
                                            <div><strong>Description:</strong> {professional.description || "Non renseignée"}</div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">Contact</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div><strong>Email:</strong> {professional.profile?.email}</div>
                                      <div><strong>Téléphone:</strong> {professional.profile?.phone || 'Non renseigné'}</div>
                                      <div><strong>Inscrit le:</strong> {new Date(professional.profile?.created_at).toLocaleDateString()}</div>
                                      <div><strong>Dernière mise à jour:</strong> {new Date(professional.updated_at).toLocaleDateString()}</div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold mb-4">Documents et pièces jointes</h4>
                                    
                                    {/* Section Upload Admin */}
                                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                      <h5 className="font-medium text-blue-900 mb-3">📤 Ajouter des documents (Admin)</h5>
                                      
                                      {/* Sélecteur de type */}
                                      <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Type de document
                                        </label>
                                        <select
                                          value={uploadType}
                                          onChange={(e) => setUploadType(e.target.value)}
                                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        >
                                          <option value="">Sélectionner un type...</option>
                                          <option value="siret">KBIS / SIRET</option>
                                          <option value="insurance">Assurance RC Pro</option>
                                          <option value="certification">Certification (RGE, Qualibat, etc.)</option>
                                          <option value="id">Pièce d'identité</option>
                                          <option value="portfolio">Portfolio / Réalisations</option>
                                          <option value="other">Autre document</option>
                                        </select>
                                      </div>

                                      {/* Upload fichier */}
                                      {uploadType && (
                                        <div>
                                          <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Fichier (PDF, JPG, PNG)
                                          </label>
                                          <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => handleUploadDocument(e, uploadType)}
                                            disabled={uploading}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                          />
                                        </div>
                                      )}
                                      
                                      {uploading && (
                                        <div className="mt-2 text-sm text-blue-600">
                                          ⏳ Upload en cours...
                                        </div>
                                      )}
                                    </div>

                                    {/* Liste des documents */}
                                    {documents.length === 0 ? (
                                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600">Aucun document uploadé</p>
                                        <p className="text-sm text-gray-500">Le professionnel n'a pas encore fourni de documents</p>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {documents.map((doc) => (
                                          <Card key={doc.id} className="p-4">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <FileText className="w-4 h-4" />
                                                  <span className="font-medium">{doc.file_name}</span>
                                                </div>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                  <div><strong>Type:</strong> {getDocumentTypeLabel(doc.type)}</div>
                                                  <div><strong>Statut:</strong> {getDocumentStatusBadge(doc.status)}</div>
                                                  <div><strong>Uploadé le:</strong> {new Date(doc.created_at).toLocaleDateString()}</div>
                                                  {doc.verified_at && (
                                                    <div><strong>Vérifié le:</strong> {new Date(doc.verified_at).toLocaleDateString()}</div>
                                                  )}
                                                  {doc.rejection_reason && (
                                                    <div><strong>Motif rejet:</strong> {doc.rejection_reason}</div>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex flex-col gap-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => window.open(doc.file_url, '_blank')}
                                                >
                                                  <Download className="w-4 h-4 mr-1" />
                                                  Voir
                                                </Button>
                                                
                                                {/* Remplacer document */}
                                                <div>
                                                  <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file && confirm(`Remplacer "${doc.file_name}" par "${file.name}" ?`)) {
                                                        // Supprimer l'ancien et uploader le nouveau
                                                        handleDeleteDocument(doc.id);
                                                        setTimeout(() => handleUploadDocument(e, doc.type), 500);
                                                      }
                                                    }}
                                                    className="hidden"
                                                    id={`replace-${doc.id}`}
                                                  />
                                                  <label
                                                    htmlFor={`replace-${doc.id}`}
                                                    className="block w-full text-center px-2 py-1 text-xs bg-yellow-500 text-white rounded cursor-pointer hover:bg-yellow-600"
                                                  >
                                                    🔄 Remplacer
                                                  </label>
                                                </div>
                                                
                                                {/* Supprimer document */}
                                                <Button
                                                  variant="destructive"
                                                  size="sm"
                                                  onClick={() => {
                                                    if (confirm(`Supprimer "${doc.file_name}" ?`)) {
                                                      handleDeleteDocument(doc.id);
                                                    }
                                                  }}
                                                >
                                                  <Trash2 className="w-4 h-4 mr-1" />
                                                  Supprimer
                                                </Button>
                                                
                                                {doc.status === 'pending' && (
                                                  <>
                                                    <Button
                                                      size="sm"
                                                      className="bg-green-600 hover:bg-green-700"
                                                      onClick={() => handleVerifyDocument(doc.id, professional.id)}
                                                    >
                                                      <CheckCircle className="w-4 h-4 mr-1" />
                                                      Valider
                                                    </Button>
                                                    <Button
                                                      variant="destructive"
                                                      size="sm"
                                                      onClick={() => {
                                                        const reason = window.prompt("Motif du rejet du document :");
                                                        if (reason && reason.trim()) {
                                                          handleRejectDocument(doc.id, reason.trim());
                                                        }
                                                      }}
                                                    >
                                                      <XCircle className="w-4 h-4 mr-1" />
                                                      Rejeter
                                                    </Button>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </Card>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            {professional.status === "pending" && (
                              <>
                                <Button 
                                  onClick={() => handleValidate(professional.id, professional.profile?.email, professional.company_name)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Valider
                                </Button>
                                <Button 
                                  onClick={() => {
                                    const reason = window.prompt("Motif du rejet (obligatoire) :");
                                    if (reason && reason.trim()) {
                                      handleReject(professional.id, reason.trim(), professional.profile?.email, professional.company_name);
                                    }
                                  }}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Rejeter
                                </Button>
                                <Button 
                                  onClick={() => {
                                    const reason = window.prompt("Raison de la suspension (obligatoire) :");
                                    if (reason && reason.trim()) {
                                      handleSuspend(professional.id, reason.trim(), professional.profile?.email, professional.company_name);
                                    }
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                                >
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Suspendre
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </>
  );
}
