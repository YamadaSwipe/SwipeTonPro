import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { withAdminAuth, AuthenticatedRequest } from '@/middleware/withAuth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint de réconciliation des paiements Stripe
 * Vérifie que tous les paiements Stripe réussis sont bien enregistrés dans la DB
 * Accessible uniquement aux administrateurs
 */
export default withAdminAuth(async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { days = 7, autoFix = false } = req.query;
    const daysAgo = parseInt(days as string) || 7;
    const shouldAutoFix = autoFix === 'true';

    const startTimestamp = Math.floor(Date.now() / 1000) - daysAgo * 24 * 60 * 60;

    console.log(`🔍 Réconciliation des paiements des ${daysAgo} derniers jours...`);

    // Récupérer les sessions Stripe réussies
    const sessions = await stripe.checkout.sessions.list({
      created: { gte: startTimestamp },
      limit: 100,
    });

    const missingPayments: any[] = [];
    const inconsistentPayments: any[] = [];
    let checkedCount = 0;
    let fixedCount = 0;

    for (const session of sessions.data) {
      if (session.payment_status !== 'paid') continue;

      checkedCount++;
      const metadata = session.metadata || {};
      const type = metadata.type;

      // Vérifier selon le type de paiement
      if (type === 'match_payment' || type === 'mise_en_relation') {
        // Vérifier match_payments
        const { data: matchPayment } = await supabase
          .from('match_payments')
          .select('id, status, stripe_session_id, stripe_payment_intent_id')
          .eq('stripe_session_id', session.id)
          .maybeSingle();

        if (!matchPayment) {
          missingPayments.push({
            type: 'match_payment',
            session_id: session.id,
            payment_intent: session.payment_intent,
            amount: session.amount_total,
            metadata: session.metadata,
            created: new Date(session.created * 1000).toISOString(),
          });

          // Auto-fix si demandé
          if (shouldAutoFix && metadata.match_payment_id) {
            const { error: updateError } = await supabase
              .from('match_payments')
              .update({
                status: 'paid',
                paid_at: new Date(session.created * 1000).toISOString(),
                stripe_charge_id: session.payment_intent as string,
                stripe_session_id: session.id,
              })
              .eq('id', metadata.match_payment_id);

            if (!updateError) {
              fixedCount++;
              console.log(`✅ Fixed match_payment ${metadata.match_payment_id}`);
            }
          }
        } else if (matchPayment.status !== 'paid') {
          inconsistentPayments.push({
            type: 'match_payment',
            id: matchPayment.id,
            current_status: matchPayment.status,
            expected_status: 'paid',
            session_id: session.id,
          });

          // Auto-fix
          if (shouldAutoFix) {
            await supabase
              .from('match_payments')
              .update({
                status: 'paid',
                paid_at: new Date(session.created * 1000).toISOString(),
              })
              .eq('id', matchPayment.id);
            fixedCount++;
          }
        }
      } else if (type === 'credit_purchase') {
        // Vérifier credit_transactions
        const { data: transaction } = await supabase
          .from('credit_transactions')
          .select('id, type, amount, stripe_payment_intent_id')
          .eq('stripe_payment_intent_id', session.id)
          .eq('type', 'purchase')
          .maybeSingle();

        if (!transaction) {
          missingPayments.push({
            type: 'credit_purchase',
            session_id: session.id,
            payment_intent: session.payment_intent,
            amount: session.amount_total,
            metadata: session.metadata,
            created: new Date(session.created * 1000).toISOString(),
          });

          // Auto-fix
          if (shouldAutoFix && metadata.professional_id && metadata.credits_amount) {
            const totalCredits =
              parseInt(metadata.credits_amount) +
              parseInt(metadata.bonus_credits || '0');

            const { data: result } = await supabase.rpc('add_credits', {
              p_professional_id: metadata.professional_id,
              p_amount: totalCredits,
              p_type: 'purchase',
              p_description: `Achat ${totalCredits} crédits via Stripe (réconciliation)`,
              p_stripe_payment_intent_id: session.id,
            });

            if (result?.success) {
              fixedCount++;
              console.log(`✅ Fixed credit purchase for pro ${metadata.professional_id}`);
            }
          }
        }
      }
    }

    // Statistiques
    const stats = {
      period_days: daysAgo,
      checked_sessions: checkedCount,
      missing_payments: missingPayments.length,
      inconsistent_payments: inconsistentPayments.length,
      auto_fix_enabled: shouldAutoFix,
      fixed_count: fixedCount,
      timestamp: new Date().toISOString(),
    };

    // Logger la réconciliation
    await supabase.from('payment_logs').insert({
      event_type: 'reconciliation',
      status: missingPayments.length > 0 ? 'failed' : 'success',
      metadata: {
        stats,
        missing_count: missingPayments.length,
        inconsistent_count: inconsistentPayments.length,
      },
    });

    return res.status(200).json({
      success: true,
      stats,
      missingPayments,
      inconsistentPayments,
      message:
        missingPayments.length === 0
          ? '✅ Tous les paiements sont synchronisés'
          : `⚠️ ${missingPayments.length} paiement(s) manquant(s) détecté(s)`,
      recommendation:
        missingPayments.length > 0 && !shouldAutoFix
          ? 'Ajoutez ?autoFix=true pour corriger automatiquement'
          : null,
    });
  } catch (error: any) {
    console.error('❌ Erreur réconciliation:', error);
    return res.status(500).json({
      error: 'Erreur lors de la réconciliation',
      details: error.message,
    });
  }
});
