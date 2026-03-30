console.log('Test simple...');
const service = require('./src/services/projectService.ts');
service.createProject({
  title: 'Test',
  description: 'Test',
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
}).then(r=>console.log('Succès:',r)).catch(e=>console.error('Erreur:',e.message));
