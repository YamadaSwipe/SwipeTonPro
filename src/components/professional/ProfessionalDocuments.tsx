import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Shield,
  Building2,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  type: string;
  file_name: string;
  file_url: string;
  status: 'pending' | 'verified' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  verified_at?: string;
}

export default function ProfessionalDocuments() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState('');
  const [professionalId, setProfessionalId] = useState<string>('');

  useEffect(() => {
    loadProfessionalAndDocuments();
  }, []);

  const loadProfessionalAndDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer l'ID du professionnel
      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (professional) {
        setProfessionalId(professional.id);
        loadDocuments(professional.id);
      }
    } catch (error) {
      console.error('Erreur chargement professionnel:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (proId: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('professional_id', proId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'siret': 'KBIS / SIRET',
      'insurance': 'Assurance RC Pro',
      'certification': 'Certification',
      'id': 'Pièce d\'identité',
      'portfolio': 'Portfolio',
      'other': 'Autre'
    };
    return types[type] || type;
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-600">✅ Vérifié</Badge>;
      case 'pending': return <Badge variant="outline" className="text-orange-600 border-orange-600">⏳ En attente</Badge>;
      case 'rejected': return <Badge variant="destructive">❌ Rejeté</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleUploadDocument = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file || !professionalId) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        const response = await fetch('/api/upload-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professionalId,
            documentType,
            fileName: file.name,
            fileData: base64Data
          })
        });

        if (response.ok) {
          toast({
            title: "Document uploadé",
            description: `${file.name} a été ajouté avec succès`,
          });
          loadDocuments(professionalId);
          setUploadType('');
        } else {
          toast({
            title: "Erreur",
            description: "Erreur lors de l'upload du document",
            variant: "destructive",
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erreur upload document:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload du document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      // Supprimer de Supabase Storage
      const { data: doc } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', documentId)
        .single();

      if (doc?.file_url) {
        const filePath = doc.file_url.split('/').pop();
        if (filePath) {
          await supabase.storage
            .from('documents')
            .remove([`documents/${professionalId}/${filePath}`]);
        }
      }

      // Supprimer de la table
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
      
      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès",
      });
      
      loadDocuments(professionalId);
    } catch (error) {
      console.error('Erreur suppression document:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du document",
        variant: "destructive",
      });
    }
  };

  const getDocumentsByStatus = () => {
    return {
      all: documents,
      pending: documents.filter(d => d.status === 'pending'),
      verified: documents.filter(d => d.status === 'verified'),
      rejected: documents.filter(d => d.status === 'rejected')
    };
  };

  const stats = getDocumentsByStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mes Documents</h2>
          <p className="text-gray-600">Gérez vos documents professionnels</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gradient-accent">
              <Upload className="w-4 h-4 mr-2" />
              Ajouter un document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
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
                <div className="text-center text-blue-600">
                  <Upload className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p>Upload en cours...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.all.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vérifiés</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejetés</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tous ({stats.all.length})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({stats.pending.length})</TabsTrigger>
          <TabsTrigger value="verified">Vérifiés ({stats.verified.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejetés ({stats.rejected.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {documents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document</h3>
                <p className="text-gray-600 mb-4">Vous n'avez pas encore uploadé de document</p>
                <Button onClick={() => {
                  const trigger = document.querySelector('[data-dialog-trigger]') as HTMLElement;
                  trigger?.click();
                }}>
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter votre premier document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-sm truncate">{doc.file_name}</span>
                      </div>
                      {getDocumentStatusBadge(doc.status)}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div><strong>Type:</strong> {getDocumentTypeLabel(doc.type)}</div>
                      <div><strong>Date:</strong> {new Date(doc.created_at).toLocaleDateString()}</div>
                      {doc.verified_at && (
                        <div><strong>Vérifié le:</strong> {new Date(doc.verified_at).toLocaleDateString()}</div>
                      )}
                      {doc.rejection_reason && (
                        <div className="text-red-600"><strong>Motif:</strong> {doc.rejection_reason}</div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {stats.pending.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">Aucun document en attente</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.pending.map((doc) => (
                <Card key={doc.id} className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate">{doc.file_name}</span>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        ⏳ En attente
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{getDocumentTypeLabel(doc.type)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Uploadé le {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verified" className="space-y-4">
          {stats.verified.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">Aucun document vérifié</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.verified.map((doc) => (
                <Card key={doc.id} className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate">{doc.file_name}</span>
                      <Badge className="bg-green-600">✅ Vérifié</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{getDocumentTypeLabel(doc.type)}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Vérifié le {doc.verified_at ? new Date(doc.verified_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {stats.rejected.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">Aucun document rejeté</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.rejected.map((doc) => (
                <Card key={doc.id} className="border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate">{doc.file_name}</span>
                      <Badge variant="destructive">❌ Rejeté</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{getDocumentTypeLabel(doc.type)}</p>
                    {doc.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1">Motif: {doc.rejection_reason}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
