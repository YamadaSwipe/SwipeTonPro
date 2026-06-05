import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Valide et plafonne les estimations IA pour éviter les valeurs irréalistes
 */
function validateAndCapEstimation(
  estimationData: any,
  surface?: number,
  category?: string
): any {
  const surfaceValue = surface || 50; // Valeur par défaut
  const categoryLower = category?.toLowerCase() || '';

  // Prix maximum par m² selon le type de travaux
  const maxPricePerM2: Record<string, number> = {
    'rénovation complète': 2000,
    rénovation: 2000,
    plomberie: 200,
    électricité: 200,
    peinture: 80,
    carrelage: 150,
    maçonnerie: 200,
    menuiserie: 1500,
    isolation: 150,
    climatisation: 6000,
    'pompe à chaleur': 20000,
    fenêtres: 2000,
    'panneaux solaires': 25000,
    default: 500,
  };

  // Déterminer le prix max par m² applicable
  let applicableMax = maxPricePerM2.default;
  for (const [key, value] of Object.entries(maxPricePerM2)) {
    if (categoryLower.includes(key)) {
      applicableMax = value;
      break;
    }
  }

  // Calculer le maximum autorisé
  const maxAllowed = applicableMax * surfaceValue * 1.5; // +50% de marge

  // Plafonner les valeurs
  const cappedEstimation = { ...estimationData };

  if (cappedEstimation.estimation_min > maxAllowed) {
    console.warn(
      `⚠️ Estimation min trop haute (${cappedEstimation.estimation_min}), plafonnée à ${maxAllowed}`
    );
    cappedEstimation.estimation_min = Math.round(maxAllowed * 0.7);
  }

  if (cappedEstimation.estimation_max > maxAllowed) {
    console.warn(
      `⚠️ Estimation max trop haute (${cappedEstimation.estimation_max}), plafonnée à ${maxAllowed}`
    );
    cappedEstimation.estimation_max = Math.round(maxAllowed);
  }

  if (cappedEstimation.estimatedCost > maxAllowed) {
    console.warn(
      `⚠️ Estimated cost trop haut (${cappedEstimation.estimatedCost}), plafonné à ${maxAllowed}`
    );
    cappedEstimation.estimatedCost = Math.round(maxAllowed * 0.85);
  }

  // S'assurer que min <= max
  if (cappedEstimation.estimation_min > cappedEstimation.estimation_max) {
    cappedEstimation.estimation_min = Math.round(
      cappedEstimation.estimation_max * 0.7
    );
  }

  // S'assurer que l'écart entre min et max ne dépasse pas 50%
  const maxGap = cappedEstimation.estimation_max * 0.5;
  const currentGap =
    cappedEstimation.estimation_max - cappedEstimation.estimation_min;
  if (currentGap > maxGap) {
    cappedEstimation.estimation_min = Math.round(
      cappedEstimation.estimation_max - maxGap
    );
  }

  return cappedEstimation;
}

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

IMPORTANT : Fournissez une estimation CONSERVATRICE et RÉALISTE basée sur les tarifs du marché français 2024. Ne tenez PAS compte d'un éventuel budget client. Basez-vous uniquement sur la description technique.

Veuillez fournir :
1. Une estimation réaliste du coût total en euros (soyez prudent)
2. Les facteurs principaux qui influencent le prix
3. Une fourchette basse et haute (écart maximum 30% entre min et max)
4. Les éléments essentiels à prévoir
5. La durée estimée en jours
6. Le niveau de complexité
7. Les risques potentiels
8. Des conseils pour optimiser les coûts

CONTRAINTES :
- Estimation MINIMUM réaliste (pas trop bas)
- Estimation MAXIMUM prudente (incluant 15-20% pour imprévus)
- Pour une rénovation complète : 800-1500€/m²
- Pour peinture : 25-50€/m²
- Pour plomberie : 80-150€/m²
- Pour électricité : 90-140€/m²
- Pour carrelage : 45-90€/m²
- Pour maçonnerie : 60-120€/m²

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

    // Valider et plafonner les estimations
    const validatedEstimation = validateAndCapEstimation(
      estimationData,
      surface,
      category
    );

    console.log('✅ Validated estimation:', validatedEstimation);

    // Réponse compatible avec les deux formats
    res.status(200).json({
      success: true,
      error: null,
      estimation: validatedEstimation,
      estimatedCost: validatedEstimation.estimatedCost,
      estimation_min: validatedEstimation.estimation_min,
      estimation_max: validatedEstimation.estimation_max,
      factors: validatedEstimation.factors,
      essentials: validatedEstimation.essentials,
      categories: validatedEstimation.categories,
      complexite: validatedEstimation.complexite,
      duree_jours: validatedEstimation.duree_jours,
      risques: validatedEstimation.risques,
      conseils: validatedEstimation.conseils,
      confidence_score: validatedEstimation.confidence_score,
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
