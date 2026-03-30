const { projectService } = require('./src/services/projectService.ts');

const testData = {
  title: 'Test',
  description: 'Test project',
  category: 'Test',
  city: 'Paris',
  postal_code: '75001',
  estimated_budget_min: 1000,
  estimated_budget_max: 2000,
  desired_start_period: '1-2 mois',
  urgency: 'normal',
  surface: '50',
  property_type: 'Appartement',
  status: 'pending_validation',
  ai_estimation: null
};

console.log('🚀 Test de création de projet...');
console.log('📋 Données:', testData);

projectService.createProject(testData)
  .then(result => {
    console.log('✅ Succès:', result);
    console.log('📋 Projet créé:', result.data);
  })
  .catch(error => {
    console.error('❌ Erreur:', error.message);
    console.error('📋 Détails:', error);
  });
