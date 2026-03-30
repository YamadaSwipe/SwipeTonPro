import { supabase } from "@/integrations/supabase/client";
import { getAISettings, decrementAICredits } from "./platformService";

export interface EstimationCategory {
  nom: string;
  min: number;
  max: number;
  details?: string;
}

export interface AIEstimation {
  estimation_min: number;
  estimation_max: number;
  categories: EstimationCategory[];
  complexite: "faible" | "moyenne" | "élevée";
  duree_jours: number;
  risques: string[];
  conseils: string[];
  confidence_score: number;
}

export interface EstimationInput {
  description: string;
  surface?: number;
  ville?: string;
  type_bien?: string;
  photos?: string[];
  mode?: "text_only" | "photo_only" | "text_and_photo";
}

interface DBEstimationResult {
  id: string;
  project_id: string;
  estimation_min: number;
  estimation_max: number;
  categories: any;
  complexity: string;
  duration_days: number;
  risks: string[];
  recommendations: string[];
  confidence_score: number;
  created_at: string;
}

// === NOUVEAU : Moteur d'estimation basé sur règles métier ===

interface WorkTypePricing {
  nom: string;
  prix_base_min: number; // €/m²
  prix_base_max: number;
  duree_base: number; // jours
  complexite: "faible" | "moyenne" | "élevée";
  categories: {
    nom: string;
    pourcentage_min: number; // % du total
    pourcentage_max: number;
    details: string;
  }[];
  risques: string[];
  conseils: string[];
}

const WORK_TYPE_PRICING: Record<string, WorkTypePricing> = {
  "Rénovation complète": {
    nom: "Rénovation complète",
    prix_base_min: 800,
    prix_base_max: 1500,
    duree_base: 60,
    complexite: "élevée",
    categories: [
      {
        nom: "Démolition et préparation",
        pourcentage_min: 10,
        pourcentage_max: 15,
        details: "Démolition des cloisons, évacuation gravats, préparation du chantier",
      },
      {
        nom: "Maçonnerie et gros œuvre",
        pourcentage_min: 20,
        pourcentage_max: 25,
        details: "Reprise des murs, chapes, ouvertures, renforcements structurels",
      },
      {
        nom: "Électricité",
        pourcentage_min: 15,
        pourcentage_max: 20,
        details: "Mise aux normes complète, tableau électrique, prises, éclairages",
      },
      {
        nom: "Plomberie et sanitaires",
        pourcentage_min: 15,
        pourcentage_max: 20,
        details: "Refonte complète réseau, salle de bain, cuisine, chauffage",
      },
      {
        nom: "Isolation et cloisons",
        pourcentage_min: 10,
        pourcentage_max: 15,
        details: "Isolation thermique, cloisons placo, doublages",
      },
      {
        nom: "Revêtements et finitions",
        pourcentage_min: 20,
        pourcentage_max: 25,
        details: "Carrelage, parquet, peinture, menuiseries, cuisine équipée",
      },
    ],
    risques: [
      "Découvertes lors de la démolition (amiante, plomb, structure)",
      "Mise aux normes électriques anciennes",
      "Problèmes d'humidité ou de structure cachés",
      "Délais rallongés si imprévus",
    ],
    conseils: [
      "Prévoir 15-20% de budget supplémentaire pour les imprévus",
      "Faire réaliser un diagnostic amiante/plomb avant travaux",
      "Demander plusieurs devis détaillés",
      "Vérifier les assurances décennale des artisans",
    ],
  },
  Plomberie: {
    nom: "Plomberie",
    prix_base_min: 80,
    prix_base_max: 150,
    duree_base: 5,
    complexite: "moyenne",
    categories: [
      {
        nom: "Fournitures",
        pourcentage_min: 35,
        pourcentage_max: 45,
        details: "Tuyauterie, robinetterie, équipements sanitaires",
      },
      {
        nom: "Main d'œuvre",
        pourcentage_min: 55,
        pourcentage_max: 65,
        details: "Installation, raccordements, tests d'étanchéité",
      },
    ],
    risques: [
      "Canalisations anciennes à remplacer entièrement",
      "Problèmes de pression ou d'évacuation",
      "Normes sanitaires strictes",
    ],
    conseils: [
      "Vérifier l'état général de la tuyauterie existante",
      "Privilégier des équipements certifiés NF",
      "Demander un test d'étanchéité après travaux",
    ],
  },
  Électricité: {
    nom: "Électricité",
    prix_base_min: 90,
    prix_base_max: 140,
    duree_base: 4,
    complexite: "moyenne",
    categories: [
      {
        nom: "Tableau électrique",
        pourcentage_min: 20,
        pourcentage_max: 30,
        details: "Tableau conforme NF C 15-100, disjoncteurs, différentiels",
      },
      {
        nom: "Câblage et prises",
        pourcentage_min: 40,
        pourcentage_max: 50,
        details: "Câbles, gaines, prises de courant, interrupteurs",
      },
      {
        nom: "Main d'œuvre et mise en service",
        pourcentage_min: 30,
        pourcentage_max: 40,
        details: "Installation, raccordements, tests de conformité Consuel",
      },
    ],
    risques: [
      "Installation hors normes NF C 15-100",
      "Tableau électrique vétuste à remplacer",
      "Obligation de passage Consuel pour attestation",
    ],
    conseils: [
      "Exiger une attestation Consuel après travaux",
      "Vérifier la puissance du compteur",
      "Prévoir des prises supplémentaires pour l'évolution des besoins",
    ],
  },
  Peinture: {
    nom: "Peinture",
    prix_base_min: 25,
    prix_base_max: 50,
    duree_base: 3,
    complexite: "faible",
    categories: [
      {
        nom: "Fournitures (peinture, enduit)",
        pourcentage_min: 30,
        pourcentage_max: 40,
        details: "Peinture, sous-couche, enduit de lissage, bâches",
      },
      {
        nom: "Préparation des supports",
        pourcentage_min: 25,
        pourcentage_max: 35,
        details: "Rebouchage, ponçage, lessivage, protection",
      },
      {
        nom: "Application peinture",
        pourcentage_min: 35,
        pourcentage_max: 45,
        details: "Application 2 couches, finitions soignées",
      },
    ],
    risques: [
      "État des murs nécessitant plus de préparation",
      "Humidité ou moisissures à traiter avant peinture",
    ],
    conseils: [
      "Choisir une peinture de qualité (meilleur rendu et durabilité)",
      "Bien préparer les supports pour un résultat durable",
      "Prévoir une ventilation pendant et après travaux",
    ],
  },
  Carrelage: {
    nom: "Carrelage",
    prix_base_min: 45,
    prix_base_max: 90,
    duree_base: 7,
    complexite: "moyenne",
    categories: [
      {
        nom: "Fournitures (carrelage, colle, joints)",
        pourcentage_min: 40,
        pourcentage_max: 50,
        details: "Carreaux, colle, joints, plinthes, profilés",
      },
      {
        nom: "Préparation du support",
        pourcentage_min: 20,
        pourcentage_max: 25,
        details: "Ragréage, primaire d'accrochage, étanchéité si salle d'eau",
      },
      {
        nom: "Pose et finitions",
        pourcentage_min: 30,
        pourcentage_max: 40,
        details: "Pose, découpes, joints, nettoyage final",
      },
    ],
    risques: [
      "Sol non plan nécessitant ragréage important",
      "Étanchéité critique en salle de bain",
      "Découpes complexes selon configuration",
    ],
    conseils: [
      "Prévoir 10% de carrelage supplémentaire pour les découpes",
      "Vérifier l'étanchéité sous le carrelage en pièce d'eau",
      "Choisir un carrelage adapté à l'usage (antidérapant pour salle de bain)",
    ],
  },
  Maçonnerie: {
    nom: "Maçonnerie",
    prix_base_min: 60,
    prix_base_max: 120,
    duree_base: 10,
    complexite: "élevée",
    categories: [
      {
        nom: "Fournitures (matériaux)",
        pourcentage_min: 35,
        pourcentage_max: 45,
        details: "Briques, ciment, parpaings, linteaux, ferraillage",
      },
      {
        nom: "Main d'œuvre spécialisée",
        pourcentage_min: 55,
        pourcentage_max: 65,
        details: "Montage, coffrage, coulage, finitions",
      },
    ],
    risques: [
      "Découverte de structure non conforme",
      "Nécessité d'autorisation si mur porteur",
      "Délais importants de séchage",
    ],
    conseils: [
      "Faire vérifier par un bureau d'études si touche à la structure",
      "Demander une assurance décennale obligatoire",
      "Prévoir des délais de séchage entre étapes",
    ],
  },
  Menuiserie: {
    nom: "Menuiserie",
    prix_base_min: 300,
    prix_base_max: 800,
    duree_base: 2,
    complexite: "moyenne",
    categories: [
      {
        nom: "Fournitures (menuiseries)",
        pourcentage_min: 60,
        pourcentage_max: 70,
        details: "Fenêtres, portes, quincaillerie (selon qualité)",
      },
      {
        nom: "Pose et finitions",
        pourcentage_min: 30,
        pourcentage_max: 40,
        details: "Dépose ancienne menuiserie, pose, réglages, étanchéité",
      },
    ],
    risques: [
      "Cotes non standard nécessitant du sur-mesure",
      "Isolation et étanchéité critiques",
    ],
    conseils: [
      "Privilégier du double vitrage performant (économies d'énergie)",
      "Vérifier les aides MaPrimeRénov pour fenêtres",
      "Demander certification Acotherm ou Cekal",
    ],
  },
  Isolation: {
    nom: "Isolation",
    prix_base_min: 40,
    prix_base_max: 80,
    duree_base: 5,
    complexite: "moyenne",
    categories: [
      {
        nom: "Isolants",
        pourcentage_min: 45,
        pourcentage_max: 55,
        details: "Laine de verre, laine de roche, polystyrène ou écologique",
      },
      {
        nom: "Pose et finitions",
        pourcentage_min: 45,
        pourcentage_max: 55,
        details: "Installation, pare-vapeur, doublage placo si nécessaire",
      },
    ],
    risques: [
      "Ponts thermiques si mal posée",
      "Ventilation à adapter après isolation",
    ],
    conseils: [
      "Vérifier éligibilité aux aides (MaPrimeRénov, CEE)",
      "Choisir isolant certifié (Acermi)",
      "Prévoir une VMC si isolation renforcée",
    ],
  },
  Climatisation: {
    nom: "Climatisation",
    prix_base_min: 2000,
    prix_base_max: 5000,
    duree_base: 2,
    complexite: "moyenne",
    categories: [
      {
        nom: "Équipement climatisation",
        pourcentage_min: 60,
        pourcentage_max: 70,
        details: "Unité intérieure, extérieure, télécommande (selon puissance)",
      },
      {
        nom: "Installation et mise en service",
        pourcentage_min: 30,
        pourcentage_max: 40,
        details: "Pose, raccordements frigorifiques, électriques, mise en service",
      },
    ],
    risques: [
      "Puissance inadaptée au volume à climatiser",
      "Emplacement unité extérieure (voisinage, acoustique)",
      "Installation non conforme (perte de garantie)",
    ],
    conseils: [
      "Dimensionner selon volume et isolation",
      "Choisir un installateur certifié QualiClim",
      "Prévoir un contrat d'entretien annuel",
      "Vérifier éligibilité aux aides (CEE)",
    ],
  },
  "Pompe à chaleur": {
    nom: "Pompe à chaleur",
    prix_base_min: 8000,
    prix_base_max: 16000,
    duree_base: 5,
    complexite: "élevée",
    categories: [
      {
        nom: "Équipement PAC",
        pourcentage_min: 50,
        pourcentage_max: 60,
        details: "Pompe à chaleur (air-air, air-eau selon type), accessoires",
      },
      {
        nom: "Installation complète",
        pourcentage_min: 40,
        pourcentage_max: 50,
        details: "Pose, raccordements hydrauliques, électriques, régulation, mise en service",
      },
    ],
    risques: [
      "Dimensionnement incorrect (sous/sur-puissance)",
      "Compatibilité avec émetteurs existants (radiateurs)",
      "Nuisances sonores si mal positionnée",
      "Investissement important",
    ],
    conseils: [
      "Faire réaliser une étude thermique préalable",
      "Choisir un installateur certifié QualiPAC RGE",
      "Vérifier les aides MaPrimeRénov (jusqu'à 5000€)",
      "Privilégier COP > 3 pour efficacité",
      "Prévoir contrat maintenance obligatoire",
    ],
  },
  Fenêtres: {
    nom: "Fenêtres",
    prix_base_min: 300,
    prix_base_max: 1000,
    duree_base: 2,
    complexite: "moyenne",
    categories: [
      {
        nom: "Menuiseries (fenêtres)",
        pourcentage_min: 65,
        pourcentage_max: 75,
        details: "Fenêtres double/triple vitrage, volets (selon gamme)",
      },
      {
        nom: "Pose et finitions",
        pourcentage_min: 25,
        pourcentage_max: 35,
        details: "Dépose anciennes, pose, isolation périphérique, finitions",
      },
    ],
    risques: [
      "Cotes non standard nécessitant du sur-mesure",
      "Isolation thermique et acoustique insuffisante",
      "Défaut d'étanchéité à l'air et à l'eau",
    ],
    conseils: [
      "Privilégier Uw < 1.3 W/m².K pour performance thermique",
      "Vérifier certifications (Acotherm, Cekal, NF)",
      "Aides MaPrimeRénov disponibles (RGE obligatoire)",
      "Double vitrage minimum, triple pour orientation nord",
    ],
  },
  "Panneaux solaires": {
    nom: "Panneaux solaires photovoltaïques",
    prix_base_min: 8000,
    prix_base_max: 18000,
    duree_base: 3,
    complexite: "élevée",
    categories: [
      {
        nom: "Panneaux et onduleur",
        pourcentage_min: 55,
        pourcentage_max: 65,
        details: "Panneaux photovoltaïques, onduleur, câblage, fixations",
      },
      {
        nom: "Installation sur toiture",
        pourcentage_min: 35,
        pourcentage_max: 45,
        details: "Pose, raccordement électrique, mise en service, démarches admin",
      },
    ],
    risques: [
      "Toiture non adaptée (état, orientation, pente)",
      "Ombrages réduisant production",
      "Démarches administratives (Enedis, urbanisme)",
      "ROI variable selon tarifs rachat électricité",
    ],
    conseils: [
      "Faire étude de faisabilité (ensoleillement, orientation)",
      "Installateur certifié QualiPV RGE obligatoire",
      "Prime à l'autoconsommation disponible",
      "Vérifier garanties (25 ans panneaux, 10 ans onduleur)",
      "Déclarer en mairie (DP selon surface)",
    ],
  },
  Autre: {
    nom: "Travaux divers",
    prix_base_min: 50,
    prix_base_max: 100,
    duree_base: 5,
    complexite: "moyenne",
    categories: [
      {
        nom: "Main d'œuvre",
        pourcentage_min: 50,
        pourcentage_max: 60,
        details: "Artisan qualifié selon spécialité",
      },
      {
        nom: "Fournitures",
        pourcentage_min: 40,
        pourcentage_max: 50,
        details: "Matériaux selon nature des travaux",
      },
    ],
    risques: [
      "Étendue des travaux à préciser avec l'artisan",
      "Devis détaillé indispensable",
    ],
    conseils: [
      "Décrire précisément les travaux souhaités",
      "Demander plusieurs devis comparatifs",
      "Vérifier les assurances et qualifications",
    ],
  },
};

// Coefficients régionaux (multiplicateurs de prix)
const REGIONAL_COEFFICIENTS: Record<string, number> = {
  // Île-de-France
  paris: 1.35,
  "île-de-france": 1.3,
  // Grandes métropoles
  lyon: 1.15,
  marseille: 1.1,
  toulouse: 1.1,
  bordeaux: 1.12,
  nantes: 1.1,
  lille: 1.08,
  // Moyennes villes
  rennes: 1.05,
  montpellier: 1.08,
  nice: 1.12,
  strasbourg: 1.05,
  // Reste de la France
  default: 1.0,
};

/**
 * Génère une estimation basée sur des règles métier (sans IA)
 */
function generateRuleBasedEstimation(input: EstimationInput): AIEstimation {
  const { description, surface = 50, ville = "", type_bien = "" } = input;
  
  // Récupérer le pricing du type de travaux
  const workType = input.description.toLowerCase().includes("rénovation complète") 
    ? "Rénovation complète"
    : Object.keys(WORK_TYPE_PRICING).find(key => 
        description.toLowerCase().includes(key.toLowerCase())
      ) || "Autre";

  const pricing = WORK_TYPE_PRICING[workType];

  // Coefficient régional
  const villeNormalized = ville.toLowerCase().trim();
  const regionalCoeff = Object.keys(REGIONAL_COEFFICIENTS).find(region =>
    villeNormalized.includes(region)
  );
  const coeff = regionalCoeff ? REGIONAL_COEFFICIENTS[regionalCoeff] : REGIONAL_COEFFICIENTS.default;

  // Calcul de base
  let baseMin = pricing.prix_base_min * surface * coeff;
  let baseMax = pricing.prix_base_max * surface * coeff;

  // Ajustements selon complexité détectée dans la description
  const descLower = description.toLowerCase();
  let complexityMultiplier = 1.0;
  let detectedComplexity = pricing.complexite;

  if (descLower.includes("ancien") || descLower.includes("vétuste") || descLower.includes("rénover entièrement")) {
    complexityMultiplier = 1.2;
    detectedComplexity = "élevée";
  } else if (descLower.includes("simple") || descLower.includes("basique") || descLower.includes("rafraîchir")) {
    complexityMultiplier = 0.85;
    detectedComplexity = "faible";
  }

  baseMin *= complexityMultiplier;
  baseMax *= complexityMultiplier;

  // Génération des catégories avec montants
  const categories: EstimationCategory[] = pricing.categories.map(cat => ({
    nom: cat.nom,
    min: Math.round((baseMin * cat.pourcentage_min) / 100),
    max: Math.round((baseMax * cat.pourcentage_max) / 100),
    details: cat.details,
  }));

  // Durée ajustée selon surface
  const durationDays = Math.ceil(pricing.duree_base * (surface / 70) * complexityMultiplier);

  // Score de confiance basé sur les informations fournies
  let confidenceScore = 50; // Base
  if (surface) confidenceScore += 15;
  if (ville) confidenceScore += 10;
  if (type_bien) confidenceScore += 10;
  if (description.length > 100) confidenceScore += 15;

  return {
    estimation_min: Math.round(baseMin),
    estimation_max: Math.round(baseMax),
    categories,
    complexite: detectedComplexity,
    duree_jours: durationDays,
    risques: pricing.risques,
    conseils: pricing.conseils,
    confidence_score: Math.min(confidenceScore, 95), // Max 95% sans IA
  };
}

/**
 * Génère une estimation avec GPT-4 (si quota disponible et paramètres activés)
 */
export async function generateEstimation(
  input: EstimationInput
): Promise<AIEstimation> {
  // Vérifier les paramètres de la plateforme
  const aiSettings = await getAISettings();
  
  // Si IA désactivée, utiliser règles métier
  if (!aiSettings.enabled) {
    console.log("⚠️ IA désactivée, utilisation des règles métier");
    return generateRuleBasedEstimation(input);
  }

  // Vérifier le mode et la disponibilité des données
  const mode = input.mode || aiSettings.mode;
  
  if (mode === "photo_only" && (!input.photos || input.photos.length === 0)) {
    console.log("⚠️ Mode photo uniquement mais pas de photos, fallback règles métier");
    return generateRuleBasedEstimation(input);
  }

  if (mode === "text_only" && !input.description) {
    console.log("⚠️ Mode texte uniquement mais pas de description, fallback règles métier");
    return generateRuleBasedEstimation(input);
  }

  try {
    // Appeler l'API route sécurisée au lieu d'appeler OpenAI directement
    const response = await fetch("/api/ai-estimation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: input.description,
        surface: input.surface,
        ville: input.ville,
        type_bien: input.type_bien,
        mode: mode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate estimation");
    }

    const data = await response.json();

    if (!data.success || !data.estimation) {
      // Fallback sur les règles métier en cas d'erreur
      console.log("⚠️ Erreur API, fallback sur règles métier");
      return generateRuleBasedEstimation(input);
    }

    const estimation: AIEstimation = data.estimation;

    if (
      !estimation.estimation_min ||
      !estimation.estimation_max ||
      !Array.isArray(estimation.categories)
    ) {
      throw new Error("Invalid estimation format from API");
    }

    // Décrémenter les crédits après succès
    await decrementAICredits(1);

    return estimation;
  } catch (error: any) {
    console.error("Error with AI estimation:", error);
    
    // En cas d'erreur, utiliser les règles métier
    console.log("⚠️ Erreur API, bascule sur règles métier");
    return generateRuleBasedEstimation(input);
  }
}

/**
 * Sauvegarde une estimation en base de données
 */
export async function saveEstimation(
  projectId: string,
  estimation: AIEstimation,
  input: EstimationInput
): Promise<string> {
  try {
    const { data, error } = await (supabase
      .from("ai_estimations" as any)
      .insert({
        project_id: projectId,
        estimation_min: estimation.estimation_min,
        estimation_max: estimation.estimation_max,
        categories: estimation.categories,
        complexity: estimation.complexite,
        duration_days: estimation.duree_jours,
        risks: estimation.risques,
        recommendations: estimation.conseils,
        confidence_score: estimation.confidence_score,
        input_description: input.description,
        input_surface: input.surface,
        input_location: input.ville,
      })
      .select("id")
      .single());

    if (error) throw error;
    
    const result = data as unknown as { id: string };
    return result.id;
  } catch (error) {
    console.error("Error saving estimation:", error);
    throw new Error("Erreur lors de la sauvegarde de l'estimation");
  }
}

/**
 * Récupère l'estimation d'un projet
 */
export async function getProjectEstimation(
  projectId: string
): Promise<AIEstimation | null> {
  try {
    const { data, error } = await (supabase
      .from("ai_estimations" as any)
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle());

    if (error) throw error;
    if (!data) return null;

    const estimationData = data as unknown as DBEstimationResult;

    return {
      estimation_min: estimationData.estimation_min,
      estimation_max: estimationData.estimation_max,
      categories: estimationData.categories as EstimationCategory[],
      complexite: estimationData.complexity as "faible" | "moyenne" | "élevée",
      duree_jours: estimationData.duration_days,
      risques: estimationData.risks,
      conseils: estimationData.recommendations,
      confidence_score: estimationData.confidence_score,
    };
  } catch (error) {
    console.error("Error fetching estimation:", error);
    return null;
  }
}

/**
 * Construit le prompt pour GPT-4
 */
function buildEstimationPrompt(input: EstimationInput): string {
  let prompt = `Analyse ce projet de travaux et fournis une estimation détaillée en JSON.\n\n`;

  prompt += `Description du projet:\n"${input.description}"\n\n`;

  if (input.surface) {
    prompt += `Surface: ${input.surface}m²\n`;
  }

  if (input.ville) {
    prompt += `Localisation: ${input.ville}\n`;
  }

  if (input.type_bien) {
    prompt += `Type de bien: ${input.type_bien}\n`;
  }

  if (input.photos && input.photos.length > 0) {
    prompt += `\nPhotos fournies: ${input.photos.length} image(s)\n`;
    prompt += `Analyse les photos pour affiner l'estimation (état actuel, complexité visible).\n`;
  }

  prompt += `\nFournis un JSON avec cette structure EXACTE:\n`;
  prompt += `{
  "estimation_min": <nombre en euros>,
  "estimation_max": <nombre en euros>,
  "categories": [
    {
      "nom": "Catégorie (ex: Électricité, Plomberie, Maçonnerie)",
      "min": <prix min en euros>,
      "max": <prix max en euros>,
      "details": "Explication des travaux inclus"
    }
  ],
  "complexite": "faible" | "moyenne" | "élevée",
  "duree_jours": <nombre de jours estimés>,
  "risques": ["Liste des risques potentiels identifiés"],
  "conseils": ["Conseils pratiques pour le client"],
  "confidence_score": <0-100, score de confiance de l'estimation>
}\n\n`;

  prompt += `IMPORTANT:
- Base tes estimations sur les tarifs français moyens de 2024
- Inclus la main d'œuvre ET les matériaux
- Sois réaliste et prudent (ajoute 15-20% de marge pour imprévus dans estimation_max)
- Identifie les risques spécifiques (amiante, murs porteurs, normes électriques, etc.)
- Si des éléments manquent, indique-le dans les conseils
- Le confidence_score reflète la précision possible avec les infos fournies (moins d'infos = score plus bas)`;

  return prompt;
}

/**
 * Génère une estimation avec gestion d'erreur et fallback
 */
export async function generateEstimationWithFallback(
  input: EstimationInput
): Promise<{ success: boolean; estimation?: AIEstimation; error?: string }> {
  try {
    const estimation = await generateEstimation(input);
    
    // Marquer si c'était une estimation par règles métier (score < 95)
    const wasRuleBased = estimation.confidence_score < 95;
    
    return { 
      success: true, 
      estimation,
      error: wasRuleBased ? "Estimation calculée avec nos barèmes (service IA temporairement indisponible)" : undefined
    };
  } catch (error) {
    console.error("Estimation failed:", error);

    // Fallback final sur règles métier
    const fallbackEstimation = generateRuleBasedEstimation(input);

    return {
      success: false,
      estimation: fallbackEstimation,
      error: "Estimation approximative générée (service IA temporairement indisponible)",
    };
  }
}