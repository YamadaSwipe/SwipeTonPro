import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAdminAuth, AuthenticatedRequest } from '@/middleware/withAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default withAdminAuth(async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { professionalId, action, reason, proEmail, companyName } = req.body;

    if (!professionalId) {
      return res.status(400).json({
        error: 'ID du professionnel requis',
      });
    }

    if (!action || !['validate', 'reject', 'suspend'].includes(action)) {
      return res.status(400).json({
        error: 'Action invalide. Actions possibles: validate, reject, suspend',
      });
    }

    // Récupérer le professionnel
    const { data: professional, error: fetchError } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', professionalId)
      .single();

    if (fetchError) {
      console.error('❌ Erreur récupération professionnel:', fetchError);
      return res.status(500).json({
        error: 'Erreur lors de la récupération du professionnel',
      });
    }

    if (!professional) {
      return res.status(404).json({
        error: 'Professionnel non trouvé',
      });
    }

    // Mettre à jour le statut du professionnel
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (action === 'validate') {
      updateData.status = 'verified';
      updateData.verified_at = new Date().toISOString();
      updateData.verified_by = 'admin';
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.rejected_at = new Date().toISOString();
      updateData.rejected_by = 'admin';
      updateData.rejection_reason = reason || "Professionnel rejeté par l'administrateur";
    } else if (action === 'suspend') {
      updateData.status = 'suspended';
      updateData.suspended_at = new Date().toISOString();
      updateData.suspended_by = 'admin';
      updateData.suspension_reason = reason || "Professionnel suspendu par l'administrateur";
    }

    console.log('📝 Mise à jour professionnel:', { professionalId, updateData });

    const { data: updatedProfessional, error: updateError } = await supabase
      .from('professionals')
      .update(updateData)
      .eq('id', professionalId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour professionnel:', updateError);
      return res.status(500).json({
        error: 'Erreur lors de la mise à jour du professionnel',
        details: updateError.message,
      });
    }

    console.log('✅ Professionnel mis à jour:', updatedProfessional);

    // Envoyer une notification au professionnel si son email est disponible
    if (proEmail) {
      try {
        const notificationData = {
          professionalId,
          action,
          reason: reason || null,
          proEmail,
          companyName,
        };

        // Appeler l'API de notification
        const notificationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/notify-pro-status`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationData),
          }
        );

        if (notificationResponse.ok) {
          console.log(
            `✅ Notification envoyée au professionnel: ${proEmail}`
          );
        } else {
          console.warn('⚠️ Erreur envoi notification professionnel');
        }
      } catch (notificationError) {
        console.warn('⚠️ Erreur notification professionnel:', notificationError);
      }
    }

    // Log de l'action admin
    console.log(`🔐 Admin ${action} professionnel ${professionalId}: ${companyName || professional.company_name}`);

    return res.status(200).json({
      success: true,
      message:
        action === 'validate'
          ? 'Professionnel validé avec succès'
          : action === 'reject'
          ? 'Professionnel rejeté avec succès'
          : 'Professionnel suspendu avec succès',
      professional: updatedProfessional,
      action: action,
    });
  } catch (error) {
    console.error('❌ Erreur API validation professionnel:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de la validation du professionnel',
    });
  }
});
