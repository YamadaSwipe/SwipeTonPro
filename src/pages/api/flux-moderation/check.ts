import { NextApiRequest, NextApiResponse } from 'next';
import { fluxModerationService } from '@/services/fluxModerationService';
import { authService } from '@/services/authService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Uniquement GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Vérifier l'authentification
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { type, id } = req.query;

    if (!type || !id) {
      return res.status(400).json({ 
        error: 'type et id requis (type: professional|client|project)' 
      });
    }

    if (typeof type !== 'string' || typeof id !== 'string') {
      return res.status(400).json({ 
        error: 'type et id doivent être des chaînes de caractères' 
      });
    }

    let result;

    switch (type) {
      case 'professional':
        result = await fluxModerationService.checkProfessionalFlux(id);
        break;
      case 'client':
        result = await fluxModerationService.checkClientFlux(id);
        break;
      case 'project':
        result = await fluxModerationService.checkProjectFlux(id);
        break;
      default:
        return res.status(400).json({ 
          error: 'type doit être "professional", "client" ou "project"' 
        });
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur API flux-moderation:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors de la vérification des flux' 
    });
  }
}
