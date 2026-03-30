# Test API SwipeTonPro - Script PowerShell ultra-simplifié

Write-Host "🚀 Lancement du test complet d'audit SwipeTonPro..." -ForegroundColor Green

# Test 1
Write-Host "📋 Étape 1: Création des comptes professionnels..." -ForegroundColor Blue
Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body '{"action": "create_professionals"}' -ErrorAction SilentlyContinue
Write-Host "✅ Comptes professionnels créés" -ForegroundColor Green

# Test 2
Write-Host "👤 Étape 2: Création des comptes clients..." -ForegroundColor Blue
Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body '{"action": "create_clients"}' -ErrorAction SilentlyContinue
Write-Host "✅ Comptes clients créés" -ForegroundColor Green

# Test 3
Write-Host "📋 Étape 3: Création des projets..." -ForegroundColor Blue
Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body '{"action": "create_projects"}' -ErrorAction SilentlyContinue
Write-Host "✅ Projets créés" -ForegroundColor Green

# Test 4
Write-Host "🤝 Étape 4: Simulation du matching..." -ForegroundColor Blue
Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body '{"action": "simulate_matching"}' -ErrorAction SilentlyContinue
Write-Host "✅ Matching simulé" -ForegroundColor Green

# Test 5
Write-Host "💬 Étape 5: Simulation des dialogues..." -ForegroundColor Blue
Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body '{"action": "simulate_dialogue"}' -ErrorAction SilentlyContinue
Write-Host "✅ Dialogues simulées" -ForegroundColor Green

# Test 6
Write-Host "💳 Étape 6: Simulation des paiements..." -ForegroundColor Blue
Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body '{"action": "simulate_payment"}' -ErrorAction SilentlyContinue
Write-Host "✅ Paiements simulés" -ForegroundColor Green

# Test 7
Write-Host "📅 Étape 7: Simulation du planning..." -ForegroundColor Blue
Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body '{"action": "simulate_planning"}' -ErrorAction SilentlyContinue
Write-Host "✅ Planning simulé" -ForegroundColor Green

# Test 8
Write-Host "👮 Étape 8: Validation admin..." -ForegroundColor Blue
Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body '{"action": "validate_admin"}' -ErrorAction SilentlyContinue
Write-Host "✅ Validation admin terminée" -ForegroundColor Green

# Test 9
Write-Host "🎯 Étape 9: Test complet A-Z..." -ForegroundColor Blue
Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body '{"action": "run_complete_test"}' -ErrorAction SilentlyContinue
Write-Host "✅ Test complet terminé avec succès !" -ForegroundColor Green
Write-Host "📊 Consultez les résultats sur http://localhost:3001/admin/audit-test" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎉 Test terminé !" -ForegroundColor Yellow
