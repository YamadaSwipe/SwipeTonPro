import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow admin users
  const authHeader = req.headers.authorization?.replace('Bearer ', '');
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  // Simple admin check - in production, use proper JWT verification
  if (authHeader !== 'admin-token-123') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (req.method === 'GET') {
    try {
      // Get settings from database or return defaults
      const { data: settings, error } = await (supabase as any)
        .from('platform_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Return settings or defaults
      const defaultSettings = {
        features: {
          realtimeMessaging: true,
          availabilityManagement: true,
          emergencySystem: true,
          analytics: true,
          loyaltyProgram: true,
          publicApi: true,
          twoFactorAuth: true,
          darkMode: true,
          moderation: true
        },
        pricing: {
          emergencyMultiplier: 1.5,
          subscriptionPlans: [
            {
              id: 'starter',
              name: 'Starter',
              price: 29,
              credits: 50,
              features: ['Accès basic', '5 projets/mois', 'Support email']
            },
            {
              id: 'pro',
              name: 'Professional',
              price: 79,
              credits: 200,
              features: ['Accès complet', 'Projets illimités', 'Support prioritaire', 'Analytics'],
              popular: true
            },
            {
              id: 'enterprise',
              name: 'Enterprise',
              price: 199,
              credits: 1000,
              features: ['API complète', 'White label', 'Dédié support', 'Custom features']
            }
          ],
          leadPacks: [
            { id: 'pack1', name: 'Pack Découverte', price: 19, credits: 10 },
            { id: 'pack2', name: 'Pack Croissance', price: 49, credits: 30, discount: 15 },
            { id: 'pack3', name: 'Pack Pro', price: 99, credits: 70, discount: 25 }
          ],
          loyaltyPoints: {
            perProject: 15,
            perReview: 10,
            perReferral: 100,
            perDailyLogin: 5
          }
        },
        content: {
          welcomeText: 'Bienvenue sur SwipeTonPro - La plateforme moderne pour vos projets',
          emergencyDescription: 'Service d\'urgence disponible 24h/24 et 7j/7 avec majoration de 50%',
          loyaltyDescription: 'Cumulez des points et débloquez des avantages exclusifs',
          supportEmail: 'support@swipetonpro.fr',
          supportPhone: '09 72 58 45 12'
        },
        limits: {
          maxProjectsPerClient: 10,
          maxPhotosPerProject: 5,
          maxMessageLength: 1000,
          apiRateLimit: 100
        }
      };

      return res.status(200).json(settings?.settings || defaultSettings);

    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const settings = req.body;

      // Validate settings structure
      if (!settings.features || !settings.pricing || !settings.content || !settings.limits) {
        return res.status(400).json({ error: 'Invalid settings structure' });
      }

      // Save to database
      const { data, error } = await (supabase as any)
        .from('platform_settings')
        .upsert({
          id: 'main',
          settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update environment variables if needed
      // This would require server restart in production

      return res.status(200).json({ 
        success: true, 
        message: 'Settings saved successfully',
        data
      });

    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
