import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { withAuth, AuthenticatedRequest } from '@/middleware/withAuth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API Admin pour offrir des crédits à un professionnel
 * Méthode: POST
 * Body: { professionalId, amount, reason }
 * Accès: Réservé aux admins et modérateurs
 */
export default withAuth(async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { professionalId, amount, reason } = req.body;

    // Validation des paramètres
    if (!professionalId || !amount || !reason) {
      return res.status(400).json({
        error: 'Paramètres manquants: professionalId, amount et reason requis',
      });
    }

    // Validation UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(professionalId)) {
      return res.status(400).json({ error: 'ID de professionnel invalide' });
    }

    // Validation du montant
    const creditsAmount = parseInt(amount);
    if (isNaN(creditsAmount) || creditsAmount <= 0) {
      return res.status(400).json({
        error: 'Le montant doit être un nombre positif',
      });
    }

    // Vérifier que l'utilisateur est admin ou modérateur
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, first_name, last_name')
      .eq('id', req.user.id)
      .single();

    if (adminError || !adminProfile) {
      return res.status(403).json({
        error: 'Profil administrateur non trouvé',
      });
    }

    if (!['admin', 'super_admin', 'moderator'].includes(adminProfile.role)) {
      return res.status(403).json({
        error: 'Accès refusé: Seuls les administrateurs et modérateurs peuvent offrir des crédits',
      });
    }

    // Vérifier que le professionnel existe
    const { data: professional, error: proError } = await supabaseAdmin
      .from('professionals')
      .select('id, user_id, company_name, credits_balance')
      .eq('id', professionalId)
      .single();

    if (proError || !professional) {
      return res.status(404).json({
        error: 'Professionnel non trouvé',
      });
    }

    // Utiliser la fonction SQL admin_grant_credits
    const { data: result, error: grantError } = await supabaseAdmin.rpc(
      'admin_grant_credits',
      {
        p_professional_id: professionalId,
        p_amount: creditsAmount,
        p_reason: reason,
        p_admin_user_id: req.user.id,
      }
    );

    if (grantError) {
      console.error('Erreur admin_grant_credits:', grantError);
      return res.status(500).json({
        error: 'Erreur lors de l\'attribution des crédits',
        details: grantError.message,
      });
    }

    // Vérifier le résultat
    if (!result || !result.success) {
      return res.status(400).json({
        error: result?.error || 'Échec de l\'attribution des crédits',
        error_code: result?.error_code,
        details: result,
      });
    }

    // Récupérer les informations du professionnel pour la réponse
    const { data: updatedPro } = await supabaseAdmin
      .from('professionals')
      .select('credits_balance, company_name')
      .eq('id', professionalId)
      .single();

    return res.status(200).json({
      success: true,
      message: `${creditsAmount} crédits ont été offerts à ${professional.company_name}`,
      professional: {
        id: professionalId,
        company_name: professional.company_name,
        previous_balance: result.previous_balance,
        new_balance: result.new_balance || updatedPro?.credits_balance,
        credits_granted: creditsAmount,
      },
      admin: {
        id: req.user.id,
        name: `${adminProfile.first_name} ${adminProfile.last_name}`,
        role: adminProfile.role,
      },
      reason,
      transaction_id: result.transaction_id,
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'attribution des crédits:', error);
    return res.status(500).json({
      error: 'Erreur serveur lors de l\'attribution des crédits',
      details: error.message,
    });
  }
});
