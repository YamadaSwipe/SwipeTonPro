# Test API SwipeTonPro - Script avec curl

Write-Host "🚀 Lancement du test complet d'audit SwipeTonPro..." -ForegroundColor Green

# Test 1
Write-Host "📋 Étape 1: Création des comptes professionnels..." -ForegroundColor Blue
curl -X POST -H "Content-Type: application/json" -d '{"action": "create_professionals"}' http://localhost:3001/api/test/complete-audit
Write-Host "✅ Comptes professionnels créés" -ForegroundColor Green

# Test 2
Write-Host "👤 Étape 2: Création des comptes clients..." -ForegroundColor Blue
curl -X POST -H "Content-Type: application/json" -d '{"action": "create_clients"}' http://localhost:3001/api/test/complete-audit
Write-Host "✅ Comptes clients créés" -ForegroundColor Green

# Test 3
Write-Host "📋 Étape 3: Création des projets..." -ForegroundColor Blue
curl -X POST -H "Content-Type: application/json" -d '{"action": "create_projects"}' http://localhost:3001/api/test/complete-audit
Write-Host "✅ Projets créés" -ForegroundColor Green

# Test 4
Write-Host "🤝 Étape 4: Simulation du matching..." -ForegroundColor Blue
curl -X POST -H "Content-Type: application/json" -d '{"action": "simulate_matching"}' http://localhost:3001/api/test/complete-audit
Write-Host "✅ Matching simulé" -ForegroundColor Green

# Test 5
Write-Host "💬 Étape 5: Simulation des dialogues..." -ForegroundColor Blue
curl -X POST -H "Content-Type: application/json" -d '{"action": "simulate_dialogue"}' http://localhost:3001/api/test/complete-audit
Write-Host "✅ Dialogues simulées" -ForegroundColor Green

# Test 6
Write-Host "💳 Étape 6: Simulation des paiements..." -ForegroundColor Blue
curl -X POST -H "Content-Type: application/json" -d '{"action": "simulate_payment"}' http://localhost:3001/api/test/complete-audit
Write-Host "✅ Paiements simulés" -ForegroundColor Green

# Test 7
Write-Host "📅 Étape 7: Simulation du planning..." -ForegroundColor Blue
curl -X POST -H "Content-Type: application/json" -d '{"action": "simulate_planning"}' http://localhost:3001/api/test/complete-audit
Write-Host "✅ Planning simulé" -ForegroundColor Green

# Test 8
Write-Host "👮 Étape 8: Validation admin..." -ForegroundColor Blue
curl -X POST -H "Content-Type: application/json" -d '{"action": "validate_admin"}' http://localhost:3001/api/test/complete-audit
Write-Host "✅ Validation admin terminée" -ForegroundColor Green

# Test 9
Write-Host "🎯 Étape 9: Test complet A-Z..." -ForegroundColor Blue
curl -X POST -H "Content-Type: application/json" -d '{"action": "run_complete_test"}' http://localhost:3001/api/test/complete-audit
Write-Host "✅ Test complet terminé avec succès !" -ForegroundColor Green
Write-Host "📊 Consultez les résultats sur http://localhost:3001/admin/audit-test" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎉 Test terminé !" -ForegroundColor Yellow
