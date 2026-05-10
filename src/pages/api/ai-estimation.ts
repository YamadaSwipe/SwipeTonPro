import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Vérifier que la clé API est définie
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️ OpenAI API key non configurée, utilisation du fallback');
    return res.status(200).json({
      success: false,
      error: 'Service IA temporairement indisponible',
      fallback: true,
      message: 'Estimation calculée avec nos barèmes standards',
    });
  }

  try {
    const {
      description,
      category,
      city,
      estimated_budget_min,
      estimated_budget_max,
      surface,
      type_bien,
    } = req.body;

    // Validation des données requises
    if (!description || !category || !city) {
      return res.status(400).json({
        error: 'Données manquantes: description, category et city sont requis',
        estimatedCost: null,
      });
    }

    const prompt = `
En tant qu'expert en estimation de coûts de travaux BTP en France, veuillez estimer le coût de ce projet :

DESCRIPTION : ${description}
CATÉGORIE : ${category}
VILLE : ${city}
SURFACE : ${surface || 'Non spécifiée'} m²
TYPE DE BIEN : ${type_bien || 'Non spécifié'}
BUDGET ESTIMÉ PAR LE CLIENT : ${estimated_budget_min || 'Non spécifié'}€ - ${estimated_budget_max || 'Non spécifié'}€

Veuillez fournir :
1. Une estimation réaliste du coût total en euros
2. Les facteurs principaux qui influencent le prix
3. Une fourchette basse et haute
4. Les éléments essentiels à prévoir
5. La durée estimée en jours
6. Le niveau de complexité
7. Les risques potentiels
8. Des conseils pour optimiser les coûts

Répondez uniquement avec un JSON valide :
{
  "estimatedCost": 15000,
  "lowRange": 12000,
  "highRange": 18000,
  "estimation_min": 12000,
  "estimation_max": 18000,
  "categories": [{"nom": "Main d'œuvre", "min": 8000, "max": 10000}, {"nom": "Matériaux", "min": 4000, "max": 8000}],
  "complexite": "moyenne",
  "duree_jours": 15,
  "risques": ["Mauvais temps", "Imprévus structurels"],
  "conseils": ["Comparer 3 devis", "Prévoir 10% de marge"],
  "confidence_score": 0.8,
  "factors": ["Surface", "Qualité des matériaux", "Complexité technique"],
  "essentials": ["Main d'œuvre", "Matériaux", "Évacuation des déchets"]
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Vous êtes un expert en estimation de coûts de travaux BTP en France. Fournissez toujours des estimations réalistes basées sur les prix du marché français. Considérez les spécificités régionales et la complexité des travaux.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error("Pas de réponse de l'IA");
    }

    // Extraire le JSON de la réponse
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format de réponse invalide');
    }

    const estimationData = JSON.parse(jsonMatch[0]);

    console.log('✅ AI Estimation successful:', estimationData);

    // Réponse compatible avec les deux formats
    res.status(200).json({
      success: true,
      error: null,
      estimation: estimationData,
      estimatedCost: estimationData.estimatedCost,
      estimation_min: estimationData.estimation_min,
      estimation_max: estimationData.estimation_max,
      factors: estimationData.factors,
      essentials: estimationData.essentials,
      categories: estimationData.categories,
      complexite: estimationData.complexite,
      duree_jours: estimationData.duree_jours,
      risques: estimationData.risques,
      conseils: estimationData.conseils,
      confidence_score: estimationData.confidence_score,
    });
  } catch (error: any) {
    console.error('❌ Erreur estimation IA:', error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'estimation IA",
      details: error.message,
      estimatedCost: null,
      estimation: null,
    });
  }
}
