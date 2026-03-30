# Test API SwipeTonPro - Script PowerShell
# Usage: .\run-audit-test.ps1

Write-Host "🚀 Lancement du test complet d'audit SwipeTonPro..." -ForegroundColor Green
Write-Host ""

Write-Host "📋 Étape 1: Création des comptes professionnels..." -ForegroundColor Blue
try {
    $body = @{ action = "create_professionals" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Comptes professionnels créés" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur création comptes professionnels" -ForegroundColor Red
}

Write-Host "👤 Étape 2: Création des comptes clients..." -ForegroundColor Blue
try {
    $body = @{ action = "create_clients" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Comptes clients créés" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur création comptes clients" -ForegroundColor Red
}

Write-Host "📋 Étape 3: Création des projets..." -ForegroundColor Blue
try {
    $body = @{ action = "create_projects" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Projets créés" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur création projets" -ForegroundColor Red
}

Write-Host "🤝 Étape 4: Simulation du matching..." -ForegroundColor Blue
try {
    $body = @{ action = "simulate_matching" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Matching simulé" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur simulation matching" -ForegroundColor Red
}

Write-Host "💬 Étape 5: Simulation des dialogues..." -ForegroundColor Blue
try {
    $body = @{ action = "simulate_dialogue" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Dialogues simulées" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur simulation dialogues" -ForegroundColor Red
}

Write-Host "💳 Étape 6: Simulation des paiements..." -ForegroundColor Blue
try {
    $body = @{ action = "simulate_payment" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Paiements simulés" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur simulation paiements" -ForegroundColor Red
}

Write-Host "📅 Étape 7: Simulation du planning..." -ForegroundColor Blue
try {
    $body = @{ action = "simulate_planning" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Planning simulé" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur simulation planning" -ForegroundColor Red
}

Write-Host "👮 Étape 8: Validation admin..." -ForegroundColor Blue
try {
    $body = @{ action = "validate_admin" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Validation admin terminée" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur validation admin" -ForegroundColor Red
}

Write-Host "🎯 Étape 9: Test complet A-Z..." -ForegroundColor Blue
try {
    $body = @{ action = "run_complete_test" } | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/test/complete-audit" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Test complet terminé avec succès !" -ForegroundColor Green
    Write-Host "📊 Consultez les résultats sur http://localhost:3001/admin/audit-test" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Erreur test complet" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Appuyez sur Entrée pour continuer..." -ForegroundColor Yellow
Read-Host
