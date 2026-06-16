import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import {
  calculateEstimateWithRules,
  validateEstimation,
  getRegionalCoefficient,
} from '@/config/pricingRules';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyse une image pour extraire les informations du chantier
 */
async function analyzeImageForEstimation(
  imageBase64: string
): Promise<{
  description: string;
  category: string;
  surface?: number;
  materials?: string;
  complexity?: string;
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'Vous êtes un expert en analyse de chantiers BTP. Analysez cette image et identifiez : le type de travaux, l\'état actuel, la surface approximative visible, les matériaux présents, et la complexité estimée.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analysez cette photo de chantier et fournissez un JSON avec : description (détaillée), category (type de travaux), surface (estimation en m²), materials (matériaux visibles), complexity (faible/moyenne/élevée)',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.2,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('Pas de réponse de l\'IA pour l\'analyse d\'image');
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format de réponse invalide pour l\'analyse d\'image');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('❌ Erreur analyse image:', error);
    throw new Error('Impossible d\'analyser l\'image: ' + error.message);
  }
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
      postal_code,
      estimated_budget_min,
      estimated_budget_max,
      surface,
      type_bien,
      image_base64,
      materials,
    } = req.body;

    // Si une image est fournie, l'analyser d'abord
    let projectDescription = description;
    let projectCategory = category;
    let projectSurface = surface;
    let projectMaterials = materials;

    if (image_base64) {
      console.log('📸 Analyse d\'image en cours...');
      try {
        const imageAnalysis = await analyzeImageForEstimation(image_base64);
        console.log('✅ Analyse d\'image réussie:', imageAnalysis);

        // Enrichir les données avec l'analyse de l'image
        projectDescription = description
          ? `${description}\n\nAnalyse photo: ${imageAnalysis.description}`
          : imageAnalysis.description;
        projectCategory = category || imageAnalysis.category;
        projectSurface = surface || imageAnalysis.surface;
        projectMaterials = materials || imageAnalysis.materials;
      } catch (imageError: any) {
        console.warn('⚠️ Erreur analyse image, continuation sans:', imageError.message);
      }
    }

    // Validation des données requises
    if (!projectDescription || !projectCategory || !city) {
      return res.status(400).json({
        error: 'Données manquantes: description, category et city sont requis',
        estimatedCost: null,
      });
    }

    // Calculer une estimation de base avec les règles strictes
    const surfaceValue = parseFloat(projectSurface) || 50;
    const postalCodeValue = postal_code || '75001';
    
    const ruleBasedEstimate = calculateEstimateWithRules(
      projectCategory,
      surfaceValue,
      postalCodeValue,
      projectMaterials
    );

    console.log('📊 Estimation basée sur les règles:', ruleBasedEstimate);

    const regionalCoef = getRegionalCoefficient(postalCodeValue);
    const regionalInfo = regionalCoef !== 1.0 
      ? `\nCOEFFICIENT RÉGIONAL : ${regionalCoef} (${city})`
      : '';

    const prompt = `
En tant qu'expert en estimation de coûts de travaux BTP en France, veuillez estimer le coût de ce projet :

DESCRIPTION : ${projectDescription}
CATÉGORIE : ${projectCategory}
VILLE : ${city}
CODE POSTAL : ${postalCodeValue}
SURFACE : ${surfaceValue} m²
TYPE DE BIEN : ${type_bien || 'Non spécifié'}
MATÉRIAUX : ${projectMaterials || 'Non spécifiés'}${regionalInfo}

ESTIMATION DE RÉFÉRENCE (barèmes marché 2024-2026) :
- Fourchette basse : ${ruleBasedEstimate.min.toLocaleString()}€
- Fourchette haute : ${ruleBasedEstimate.max.toLocaleString()}€

IMPORTANT : 
1. Votre estimation DOIT être proche de la référence ci-dessus (±20% maximum)
2. Basez-vous sur les tarifs réels du marché BTP français 2024-2026
3. Tenez compte du coefficient régional et de la qualité des matériaux
4. NE PAS tenir compte du budget client - estimation objective uniquement

Veuillez fournir :
1. Une estimation réaliste du coût total en euros
2. Les facteurs principaux qui influencent le prix
3. Une fourchette basse et haute (écart maximum 50% entre min et max)
4. Les éléments essentiels à prévoir
5. La durée estimée en jours
6. Le niveau de complexité (faible/moyenne/élevée)
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
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Vous êtes un expert en estimation de coûts de travaux BTP en France avec 20 ans d\'expérience. Vous connaissez parfaitement les tarifs du marché 2024-2026, les spécificités régionales, et les variations de prix selon les matériaux. Vos estimations sont toujours réalistes, conservatrices et basées sur des données de marché vérifiables. Vous respectez STRICTEMENT les fourchettes de référence fournies.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.2,
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

    console.log('✅ AI Estimation brute:', estimationData);

    // Valider l'estimation IA contre les règles strictes
    const validation = validateEstimation(
      {
        min: estimationData.estimation_min || estimationData.lowRange,
        max: estimationData.estimation_max || estimationData.highRange,
      },
      projectCategory,
      surfaceValue,
      postalCodeValue
    );

    // Utiliser l'estimation corrigée si nécessaire
    let finalEstimation = estimationData;
    if (!validation.isValid && validation.correctedEstimation) {
      console.warn('⚠️ Estimation IA corrigée:', validation.warnings);
      finalEstimation = {
        ...estimationData,
        estimation_min: validation.correctedEstimation.min,
        estimation_max: validation.correctedEstimation.max,
        estimatedCost: Math.round(
          (validation.correctedEstimation.min + validation.correctedEstimation.max) / 2
        ),
        lowRange: validation.correctedEstimation.min,
        highRange: validation.correctedEstimation.max,
        validation_warnings: validation.warnings,
        corrected_by_rules: true,
      };
    }

    console.log('✅ Estimation finale validée:', finalEstimation);

    // Réponse compatible avec les deux formats
    res.status(200).json({
      success: true,
      error: null,
      estimation: finalEstimation,
      estimatedCost: finalEstimation.estimatedCost,
      estimation_min: finalEstimation.estimation_min,
      estimation_max: finalEstimation.estimation_max,
      factors: finalEstimation.factors,
      essentials: finalEstimation.essentials,
      categories: finalEstimation.categories,
      complexite: finalEstimation.complexite,
      duree_jours: finalEstimation.duree_jours,
      risques: finalEstimation.risques,
      conseils: finalEstimation.conseils,
      confidence_score: finalEstimation.confidence_score,
      validation_warnings: finalEstimation.validation_warnings,
      corrected_by_rules: finalEstimation.corrected_by_rules,
      rule_based_estimate: ruleBasedEstimate,
      regional_coefficient: regionalCoef,
      image_analyzed: !!image_base64,
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
