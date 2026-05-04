import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId } = req.query;

    if (!projectId || Array.isArray(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Récupérer les informations du projet
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('accord_pdf_url, accord_pdf_path, accord_status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.accord_pdf_url || project.accord_status !== 'generated') {
      return res.status(404).json({ error: 'Accord PDF not generated yet' });
    }

    // Télécharger le PDF depuis Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(project.accord_pdf_path!);

    if (downloadError) {
      console.error('Error downloading PDF:', downloadError);
      return res.status(500).json({ error: 'Failed to download PDF' });
    }

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="accord-mutuel-${projectId}.pdf"`
    );
    res.setHeader('Cache-Control', 'no-cache');

    // Envoyer le fichier
    const buffer = await fileData.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error downloading accord PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
