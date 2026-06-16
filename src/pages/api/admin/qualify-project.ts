import { NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAdminAuth, AuthenticatedRequest } from '@/middleware/withAuth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API Admin pour qualifier/déqualifier manuellement un projet
 * Méthode: POST
 * Body: { projectId, qualify }
 * Accès: Réservé aux admins, modérateurs et support
 */
export default withAdminAuth(async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { projectId, qualify } = req.body;

    // Validation des paramètres
    if (!projectId) {
      return res.status(400).json({ error: 'ID du projet requis' });
    }

    // Validation UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      return res.status(400).json({ error: 'ID de projet invalide' });
    }

    // Vérifier que le projet existe
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, title, status, is_project_qualified')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      is_project_qualified: qualify !== false,
      qualified_by: qualify !== false ? req.user!.id : null,
      qualified_at: qualify !== false ? new Date().toISOString() : null,
    };

    // Mettre à jour le projet
    const { data: updatedProject, error: updateError } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur qualification projet:', updateError);
      return res.status(500).json({
        error: 'Erreur lors de la qualification du projet',
        details: updateError.message,
      });
    }

    console.log(
      `✅ Projet ${qualify !== false ? 'qualifié' : 'déqualifié'} par ${req.user!.email}: ${project.title}`
    );

    return res.status(200).json({
      success: true,
      message:
        qualify !== false
          ? 'Projet qualifié avec succès'
          : 'Qualification retirée avec succès',
      project: updatedProject,
      action: qualify !== false ? 'qualified' : 'unqualified',
      qualified_by: req.user!.id,
    });
  } catch (error: any) {
    console.error('❌ Erreur API qualify-project:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de la qualification du projet',
      details: error.message,
    });
  }
});
