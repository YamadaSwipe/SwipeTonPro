/**
 * Script de test pour le module d'estimation IA amélioré
 * Usage: node test-estimation-ia.js
 */

const API_URL = 'http://localhost:3000';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Tests à exécuter
const tests = [
  {
    name: 'Test 1: Peinture à Paris (coefficient régional 1.25)',
    data: {
      description: 'Peinture complète d\'un salon de 30m²',
      category: 'Peinture',
      city: 'Paris',
      postal_code: '75001',
      surface: 30,
      type_bien: 'Appartement',
    },
    expectedMin: 900, // 30m² × 25€ × 1.25
    expectedMax: 2300, // 30m² × 60€ × 1.25
  },
  {
    name: 'Test 2: Rénovation salle de bain à Lyon (coefficient 1.10)',
    data: {
      description: 'Rénovation complète salle de bain avec douche italienne',
      category: 'Salle de bain',
      city: 'Lyon',
      postal_code: '69001',
      surface: 8,
      type_bien: 'Appartement',
      materials: 'moyen de gamme',
    },
    expectedMin: 5000, // 8m² × 600€ × 1.10
    expectedMax: 22000, // 8m² × 2500€ × 1.10
  },
  {
    name: 'Test 3: Plomberie en Bretagne (coefficient 0.95)',
    data: {
      description: 'Remplacement complet de la plomberie',
      category: 'Plomberie',
      city: 'Rennes',
      postal_code: '35000',
      surface: 50,
      type_bien: 'Maison',
    },
    expectedMin: 3800, // 50m² × 80€ × 0.95
    expectedMax: 9500, // 50m² × 200€ × 0.95
  },
  {
    name: 'Test 4: Cuisine haut de gamme à Paris',
    data: {
      description: 'Installation cuisine équipée haut de gamme',
      category: 'Cuisine',
      city: 'Paris',
      postal_code: '75016',
      surface: 12,
      type_bien: 'Appartement',
      materials: 'haut de gamme',
    },
    expectedMin: 15000, // 12m² × 500€ × 1.25 × 2.5
    expectedMax: 60000, // 12m² × 2000€ × 1.25 × 2.5
  },
  {
    name: 'Test 5: Extension en province (coefficient 0.90)',
    data: {
      description: 'Extension de maison 25m²',
      category: 'Extension',
      city: 'Dijon',
      postal_code: '21000',
      surface: 25,
      type_bien: 'Maison',
    },
    expectedMin: 27000, // 25m² × 1200€ × 0.90
    expectedMax: 56250, // 25m² × 2500€ × 0.90
  },
];

async function testEstimation(test) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`📋 ${test.name}`, 'blue');
  log('='.repeat(80), 'cyan');

  try {
    const response = await fetch(`${API_URL}/api/ai-estimation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(test.data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Afficher les données envoyées
    log('\n📤 Données envoyées:', 'yellow');
    console.log(JSON.stringify(test.data, null, 2));

    // Afficher les résultats
    log('\n📥 Résultats reçus:', 'yellow');
    log(`  • Estimation min: ${result.estimation_min?.toLocaleString()}€`, 'green');
    log(`  • Estimation max: ${result.estimation_max?.toLocaleString()}€`, 'green');
    log(`  • Coût estimé: ${result.estimatedCost?.toLocaleString()}€`, 'green');
    log(`  • Coefficient régional: ${result.regional_coefficient}`, 'cyan');
    log(`  • Complexité: ${result.complexite}`, 'cyan');
    log(`  • Durée: ${result.duree_jours} jours`, 'cyan');

    // Afficher l'estimation de référence
    if (result.rule_based_estimate) {
      log('\n📊 Estimation de référence (barèmes):', 'yellow');
      log(`  • Min: ${result.rule_based_estimate.min?.toLocaleString()}€`, 'cyan');
      log(`  • Max: ${result.rule_based_estimate.max?.toLocaleString()}€`, 'cyan');
      log(`  • Confiance: ${(result.rule_based_estimate.confidence * 100).toFixed(0)}%`, 'cyan');
    }

    // Vérifier si correction appliquée
    if (result.corrected_by_rules) {
      log('\n⚠️  Correction automatique appliquée:', 'yellow');
      result.validation_warnings?.forEach((warning) => {
        log(`  • ${warning}`, 'yellow');
      });
    }

    // Afficher les conseils
    if (result.conseils && result.conseils.length > 0) {
      log('\n💡 Conseils:', 'yellow');
      result.conseils.forEach((conseil) => {
        log(`  • ${conseil}`, 'cyan');
      });
    }

    // Validation du test
    log('\n✅ Validation:', 'yellow');
    const minOk = result.estimation_min >= test.expectedMin * 0.7 && 
                  result.estimation_min <= test.expectedMin * 1.5;
    const maxOk = result.estimation_max >= test.expectedMax * 0.7 && 
                  result.estimation_max <= test.expectedMax * 1.5;

    if (minOk && maxOk) {
      log(`  ✓ Estimation dans la fourchette attendue`, 'green');
      log(`    Attendu: ${test.expectedMin.toLocaleString()}€ - ${test.expectedMax.toLocaleString()}€`, 'green');
      log(`    Reçu: ${result.estimation_min?.toLocaleString()}€ - ${result.estimation_max?.toLocaleString()}€`, 'green');
    } else {
      log(`  ✗ Estimation hors fourchette attendue`, 'red');
      log(`    Attendu: ${test.expectedMin.toLocaleString()}€ - ${test.expectedMax.toLocaleString()}€`, 'red');
      log(`    Reçu: ${result.estimation_min?.toLocaleString()}€ - ${result.estimation_max?.toLocaleString()}€`, 'red');
    }

    return { success: true, result };
  } catch (error) {
    log(`\n❌ Erreur: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  log('\n🚀 Démarrage des tests du module d\'estimation IA', 'blue');
  log('='.repeat(80), 'cyan');

  const results = [];

  for (const test of tests) {
    const result = await testEstimation(test);
    results.push({ test: test.name, ...result });
    
    // Pause entre les tests pour ne pas surcharger l'API
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Résumé
  log('\n\n' + '='.repeat(80), 'cyan');
  log('📊 RÉSUMÉ DES TESTS', 'blue');
  log('='.repeat(80), 'cyan');

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  log(`\nTotal: ${results.length} tests`, 'yellow');
  log(`Réussis: ${successCount}`, 'green');
  log(`Échoués: ${failCount}`, failCount > 0 ? 'red' : 'green');

  if (failCount > 0) {
    log('\n❌ Tests échoués:', 'red');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        log(`  • ${r.test}: ${r.error}`, 'red');
      });
  }

  log('\n' + '='.repeat(80), 'cyan');
  log(
    successCount === results.length
      ? '✅ Tous les tests ont réussi !'
      : '⚠️  Certains tests ont échoué',
    successCount === results.length ? 'green' : 'yellow'
  );
  log('='.repeat(80) + '\n', 'cyan');
}

// Vérifier que le serveur est accessible
async function checkServer() {
  try {
    const response = await fetch(`${API_URL}/api/health`).catch(() => null);
    if (!response) {
      log('\n⚠️  Le serveur ne semble pas accessible sur ' + API_URL, 'yellow');
      log('Assurez-vous que le serveur Next.js est démarré (npm run dev)', 'yellow');
      log('Les tests vont continuer mais pourraient échouer...\n', 'yellow');
    }
  } catch (error) {
    // Ignorer les erreurs de santé
  }
}

// Exécution
(async () => {
  await checkServer();
  await runAllTests();
})();
