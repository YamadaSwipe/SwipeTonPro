import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, FileText, AlertCircle, Printer } from 'lucide-react';
import Link from 'next/link';

interface LegalDocument {
  id: string;
  title: string;
  content: string;
  version: string;
  effective_date: string;
  updated_at: string;
}

const DOCUMENT_TITLES: Record<string, string> = {
  cgv: 'Conditions Générales de Vente',
  cgu: "Conditions Générales d'Utilisation",
  privacy: 'Politique de Confidentialité',
  mentions_legales: 'Mentions Légales',
};

export default function LegalDocumentPage() {
  const router = useRouter();
  const { type } = router.query;
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!type || typeof type !== 'string') return;

    const fetchDocument = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_legal_document', {
            doc_type: type
          });

        if (error) throw error;

        if (data && data.length > 0) {
          setDocument(data[0]);
        } else {
          setError('Document non trouvé');
        }
      } catch (err) {
        console.error('Erreur chargement document:', err);
        setError('Impossible de charger le document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [type]);

  const handlePrint = () => {
    window.print();
  };

  if (!type || typeof type !== 'string') {
    return null;
  }

  const pageTitle = DOCUMENT_TITLES[type] || 'Document Légal';

  return (
    <>
      <SEO title={`${pageTitle} | Swipe Ton Pro`} />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="print:shadow-none">
            <CardHeader className="border-b print:border-none">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <CardTitle className="text-2xl">{pageTitle}</CardTitle>
                  {document && (
                    <p className="text-sm text-gray-500 mt-1">
                      Version {document.version} - En vigueur depuis le{' '}
                      {new Date(document.effective_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : document ? (
                <div
                  className="prose prose-blue max-w-none print:prose-black"
                  dangerouslySetInnerHTML={{ __html: document.content }}
                />
              ) : null}
            </CardContent>
          </Card>

          {/* Footer links */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(DOCUMENT_TITLES).map(([key, title]) => (
              <Link
                key={key}
                href={`/legal/${key}`}
                className={`text-sm text-center p-3 rounded-lg border transition-colors ${
                  type === key
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: [
      { params: { type: 'cgv' } },
      { params: { type: 'cgu' } },
      { params: { type: 'privacy' } },
      { params: { type: 'mentions_legales' } },
    ],
    fallback: false,
  };
}

export async function getStaticProps() {
  return {
    props: {},
  };
}
