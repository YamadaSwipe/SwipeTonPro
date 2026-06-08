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
    const { userIds, action, reason } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: 'IDs des utilisateurs requis',
      });
    }

    if (!action || !['activate', 'suspend', 'block', 'delete', 'admin', 'support', 'moderator'].includes(action)) {
      return res.status(400).json({
        error: 'Action invalide. Actions possibles: activate, suspend, block, delete, admin, support, moderator',
      });
    }

    // Récupérer les profils avec emails
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, user_id, role')
      .in('id', userIds);

    if (fetchError) {
      console.error('❌ Erreur récupération profils:', fetchError);
      return res.status(500).json({
        error: 'Erreur lors de la récupération des profils',
      });
    }

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({
        error: 'Profils non trouvés',
      });
    }

    let updateData: any = {
      updated_at: new Date().toISOString(),
    };

    let actionType = '';

    switch (action) {
      case 'activate':
        updateData.status = 'verified';
        updateData.validation_status = 'verified';
        actionType = 'activate';
        break;
      case 'suspend':
        updateData.status = 'suspended';
        updateData.validation_status = 'suspended';
        actionType = 'suspend';
        break;
      case 'block':
        updateData.status = 'blocked';
        updateData.validation_status = 'blocked';
        actionType = 'block';
        break;
      case 'delete':
        actionType = 'delete';
        break;
      case 'admin':
        updateData.role = 'admin';
        actionType = 'role_change';
        break;
      case 'support':
        updateData.role = 'support';
        actionType = 'role_change';
        break;
      case 'moderator':
        updateData.role = 'moderator';
        actionType = 'role_change';
        break;
    }

    console.log('📝 Action comptes:', { userIds, action, updateData });

    // Si suppression
    if (action === 'delete') {
      for (const profile of profiles) {
        // Supprimer le profil
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id);

        if (deleteError) {
          console.error('❌ Erreur suppression profil:', deleteError);
          continue;
        }

        // Supprimer l'utilisateur auth de Supabase
        if (profile.user_id) {
          const { error: authError } = await supabase.auth.admin.deleteUser(profile.user_id);
          if (authError) {
            console.warn('⚠️ Impossible de supprimer auth user:', authError);
          }
        }

        // Envoyer notification de suppression
        if (profile.email) {
          await sendAccountNotification(profile.email, profile.full_name || 'Utilisateur', 'delete', reason);
        }
      }

      return res.status(200).json({
        success: true,
        message: `${profiles.length} utilisateur(s) supprimé(s)`,
        action: 'delete',
      });
    }

    // Si blocage (bannir l'utilisateur auth)
    if (action === 'block') {
      for (const profile of profiles) {
        // Mettre à jour le profil
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', profile.id);

        if (updateError) {
          console.error('❌ Erreur mise à jour profil:', updateError);
          continue;
        }

        // Bannir l'utilisateur auth dans Supabase
        if (profile.user_id) {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            profile.user_id,
            { ban_duration: '365d' } // Bannir pour 1 an
          );
          if (authError) {
            console.warn('⚠️ Impossible de bannir auth user:', authError);
          }
        }

        // Envoyer notification de blocage
        if (profile.email) {
          await sendAccountNotification(profile.email, profile.full_name || 'Utilisateur', 'block', reason);
        }
      }

      return res.status(200).json({
        success: true,
        message: `${profiles.length} utilisateur(s) bloqué(s)`,
        action: 'block',
      });
    }

    // Pour les autres actions (activate, suspend, role changes)
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .in('id', userIds);

    if (updateError) {
      console.error('❌ Erreur mise à jour profils:', updateError);
      return res.status(500).json({
        error: 'Erreur lors de la mise à jour des profils',
        details: updateError.message,
      });
    }

    console.log('✅ Profils mis à jour');

    // Envoyer notifications pour chaque utilisateur
    for (const profile of profiles) {
      if (profile.email) {
        await sendAccountNotification(profile.email, profile.full_name || 'Utilisateur', action, reason);
      }
    }

    return res.status(200).json({
      success: true,
      message: `${profiles.length} utilisateur(s) mis à jour(s)`,
      action: action,
    });
  } catch (error) {
    console.error('❌ Erreur API account actions:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de l\'action sur les comptes',
    });
  }
});

async function sendAccountNotification(
  email: string,
  userName: string,
  action: string,
  reason?: string
) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/account-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        userName,
        action,
        reason,
      }),
    });

    if (response.ok) {
      console.log(`✅ Notification envoyée à ${email} pour action ${action}`);
    } else {
      console.warn(`⚠️ Erreur envoi notification à ${email}`);
    }
  } catch (error) {
    console.warn('⚠️ Erreur notification:', error);
  }
}
