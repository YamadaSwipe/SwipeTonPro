import { NextApiRequest, NextApiResponse } from 'next';
import { btpQualificationService } from '@/services/btpQualificationService';
import { authService } from '@/services/authService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Uniquement POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Vérifier l'authentification (admin ou système)
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { projectData } = req.body;

    // Validation des données requises
    if (!projectData) {
      return res.status(400).json({ 
        error: 'projectData requis' 
      });
    }

    // Validation des champs obligatoires
    const requiredFields = ['title', 'description', 'category', 'city', 'budgetMin', 'budgetMax', 'project_type'];
    for (const field of requiredFields) {
      if (!projectData[field]) {
        return res.status(400).json({ 
          error: `Champ requis manquant: ${field}` 
        });
      }
    }

    // Validation des types
    if (typeof projectData.budgetMin !== 'number' || typeof projectData.budgetMax !== 'number') {
      return res.status(400).json({ 
        error: 'budgetMin et budgetMax doivent être des nombres' 
      });
    }

    if (!['estimation', 'firm_project'].includes(projectData.project_type)) {
      return res.status(400).json({ 
        error: 'project_type doit être "estimation" ou "firm_project"' 
      });
    }

    // Qualifier le projet
    const qualification = await btpQualificationService.qualifyProject(projectData);

    return res.status(200).json({
      success: true,
      data: qualification
    });

  } catch (error) {
    console.error('❌ Erreur API btp-qualification:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors de la qualification BTP' 
    });
  }
}
