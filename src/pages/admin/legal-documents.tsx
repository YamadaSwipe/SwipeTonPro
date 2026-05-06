import { useState, useEffect } from 'react';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Save, 
  Download, 
  History, 
  AlertCircle, 
  CheckCircle,
  ExternalLink,
  Upload
} from 'lucide-react';

interface LegalDocument {
  id: string;
  document_type: 'cgv' | 'cgu' | 'privacy' | 'mentions_legales';
  title: string;
  content: string;
  version: string;
  is_active: boolean;
  effective_date: string;
  updated_at: string;
}

const DOCUMENT_TYPES = {
  cgv: { label: 'Conditions Générales de Vente', icon: FileText },
  cgu: { label: "Conditions Générales d'Utilisation", icon: FileText },
  privacy: { label: 'Politique de Confidentialité', icon: FileText },
  mentions_legales: { label: 'Mentions Légales', icon: FileText },
} as const;

export default function LegalDocumentsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<keyof typeof DOCUMENT_TYPES>('cgv');
  const [documents, setDocuments] = useState<Record<string, LegalDocument>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedContent, setEditedContent] = useState<Record<string, { title: string; content: string }>>({});

  // Charger tous les documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('legal_documents')
          .select('*')
          .eq('is_active', true)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const docsMap: Record<string, LegalDocument> = {};
        const editsMap: Record<string, { title: string; content: string }> = {};
        
        data?.forEach((doc: LegalDocument) => {
          docsMap[doc.document_type] = doc;
          editsMap[doc.document_type] = { title: doc.title, content: doc.content };
        });

        setDocuments(docsMap);
        setEditedContent(editsMap);
      } catch (err) {
        console.error('Erreur chargement documents:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les documents légaux',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [toast]);

  const handleSave = async (docType: keyof typeof DOCUMENT_TYPES) => {
    setSaving(true);
    try {
      const edit = editedContent[docType];
      if (!edit) return;

      const { data, error } = await supabase
        .rpc('update_legal_document', {
          doc_type: docType,
          new_title: edit.title,
          new_content: edit.content,
          new_version: null, // Auto-increment
        });

      if (error) throw error;

      toast({
        title: 'Document sauvegardé',
        description: `${DOCUMENT_TYPES[docType].label} mis à jour (nouvelle version)`,
      });

      // Recharger les documents
      const { data: refreshedData, error: refreshError } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('document_type', docType)
        .eq('is_active', true)
        .single();

      if (!refreshError && refreshedData) {
        setDocuments(prev => ({ ...prev, [docType]: refreshedData }));
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le document',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (docType: keyof typeof DOCUMENT_TYPES) => {
    const doc = documents[docType];
    if (!doc) return;

    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType}_v${doc.version}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Téléchargement',
      description: `${doc.title} téléchargé`,
    });
  };

  const handleEditChange = (docType: string, field: 'title' | 'content', value: string) => {
    setEditedContent(prev => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <>
      <SEO title="Documents Légaux | Admin" />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Documents Légaux
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les CGV, CGU, politique de confidentialité et mentions légales.
            Les modifications créent automatiquement une nouvelle version.
          </p>
        </div>

        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            Les documents sont accessibles publiquement via : /legal/[type] (ex: /legal/cgv)
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as keyof typeof DOCUMENT_TYPES)}>
          <TabsList className="grid grid-cols-4 mb-6">
            {Object.entries(DOCUMENT_TYPES).map(([key, { label }]) => (
              <TabsTrigger key={key} value={key} className="text-sm">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(DOCUMENT_TYPES).map(([docType, { label }]) => {
            const doc = documents[docType];
            const edit = editedContent[docType] || { title: '', content: '' };

            return (
              <TabsContent key={docType} value={docType}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{label}</CardTitle>
                        <CardDescription>
                          {doc ? (
                            <span className="flex items-center gap-2 mt-1">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Version {doc.version} - Mis à jour le{' '}
                              {new Date(doc.updated_at).toLocaleDateString('fr-FR')}
                            </span>
                          ) : (
                            'Aucune version active'
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(docType as keyof typeof DOCUMENT_TYPES)}
                          disabled={!doc}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/legal/${docType}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Voir public
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor={`${docType}-title`}>Titre du document</Label>
                      <Input
                        id={`${docType}-title`}
                        value={edit.title}
                        onChange={(e) => handleEditChange(docType, 'title', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`${docType}-content`}>Contenu</Label>
                      <Textarea
                        id={`${docType}-content`}
                        value={edit.content}
                        onChange={(e) => handleEditChange(docType, 'content', e.target.value)}
                        className="mt-1 min-h-[400px] font-mono text-sm"
                        placeholder="Rédigez le contenu du document ici..."
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Supporte le HTML pour la mise en forme (balises &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, etc.)
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button
                        onClick={() => handleSave(docType as keyof typeof DOCUMENT_TYPES)}
                        disabled={saving || !edit.title || !edit.content}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Sauvegarder (nouvelle version)
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </>
  );
}
