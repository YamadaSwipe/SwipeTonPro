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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { projectId, action, reason } = req.body;

    if (!projectId) {
      return res.status(400).json({ 
        error: 'ID du projet requis' 
      });
    }

    if (!action || !['validate', 'reject'].includes(action)) {
      return res.status(400).json({ 
        error: 'Action invalide. Actions possibles: validate, reject' 
      });
    }

    // Récupérer le projet
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      console.error('❌ Erreur récupération projet:', fetchError);
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération du projet' 
      });
    }

    if (!project) {
      return res.status(404).json({ 
        error: 'Projet non trouvé' 
      });
    }

    // Mettre à jour le statut du projet
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (action === 'validate') {
      updateData.status = 'validated';
      updateData.validated_at = new Date().toISOString();
      updateData.validated_by = 'admin';
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.rejected_at = new Date().toISOString();
      updateData.rejected_by = 'admin';
      updateData.rejection_reason = reason || 'Projet rejeté par l\'administrateur';
    }

    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour projet:', updateError);
      return res.status(500).json({ 
        error: 'Erreur lors de la mise à jour du projet' 
      });
    }

    // Envoyer une notification au client si son email est disponible
    if (project.client_email) {
      try {
        const notificationData = {
          projectId: project.id,
          projectTitle: project.title,
          clientEmail: project.client_email,
          action: action,
          reason: reason || null,
        };

        // Appeler l'API de notification
        const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/project-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData),
        });

        if (notificationResponse.ok) {
          console.log(`✅ Notification envoyée au client: ${project.client_email}`);
        } else {
          console.warn('⚠️ Erreur envoi notification client');
        }
      } catch (notificationError) {
        console.warn('⚠️ Erreur notification client:', notificationError);
      }
    }

    // Log de l'action admin
    console.log(`🔐 Admin ${action} projet ${projectId}: ${project.title}`);

    return res.status(200).json({
      success: true,
      message: action === 'validate' 
        ? 'Projet validé avec succès' 
        : 'Projet rejeté avec succès',
      project: updatedProject,
      action: action,
    });

  } catch (error) {
    console.error('❌ Erreur API validation projet:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors de la validation du projet' 
    });
  }
}
