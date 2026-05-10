import { NextApiRequest, NextApiResponse } from 'next';
import { getRecentEvents, getSecurityStats } from '@/middleware/securityMonitoring';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 50, riskLevel, stats } = req.query;

    if (stats === 'true') {
      // Retourner les statistiques
      const stats = getSecurityStats();
      return res.status(200).json({
        success: true,
        stats
      });
    }

    // Retourner les événements récents
    const events = getRecentEvents(
      parseInt(limit as string) || 50,
      riskLevel as any
    );

    return res.status(200).json({
      success: true,
      events,
      total: events.length
    });

  } catch (error: any) {
    console.error('❌ Error in security monitoring API:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
