const { projectService } = require('./src/services/projectService.ts');

projectService.createProject({
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
}).then(result => {
  console.log('✅ Succès:', result);
}).catch(error => {
  console.error('❌ Erreur:', error.message);
});
