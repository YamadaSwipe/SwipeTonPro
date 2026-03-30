@echo off
echo "🚀 Lancement du test complet d'audit SwipeTonPro..."
echo.

echo "📋 Étape 1: Création des comptes professionnels..."
curl -X POST http://localhost:3001/api/test/complete-audit -H "Content-Type: application/json" -d "{\"action\":\"create_professionals\"}"
echo.

echo "👤 Étape 2: Création des comptes clients..."
curl -X POST http://localhost:3001/api/test/complete-audit -H "Content-Type: application/json" -d "{\"action\":\"create_clients\"}"
echo.

echo "📋 Étape 3: Création des projets..."
curl -X POST http://localhost:3001/api/test/complete-audit -H "Content-Type: application/json" -d "{\"action\":\"create_projects\"}"
echo.

echo "🤝 Étape 4: Simulation du matching..."
curl -X POST http://localhost:3001/api/test/complete-audit -H "Content-Type: application/json" -d "{\"action\":\"simulate_matching\"}"
echo.

echo "💬 Étape 5: Simulation des dialogues..."
curl -X POST http://localhost:3001/api/test/complete-audit -H "Content-Type: application/json" -d "{\"action\":\"simulate_dialogue\"}"
echo.

echo "💳 Étape 6: Simulation des paiements..."
curl -X POST http://localhost:3001/api/test/complete-audit -H "Content-Type: application/json" -d "{\"action\":\"simulate_payment\"}"
echo.

echo "📅 Étape 7: Simulation du planning..."
curl -X POST http://localhost:3001/api/test/complete-audit -H "Content-Type: application/json" -d "{\"action\":\"simulate_planning\"}"
echo.

echo "👮 Étape 8: Validation admin..."
curl -X POST http://localhost:3001/api/test/complete-audit -H "Content-Type: application/json" -d "{\"action\":\"validate_admin\"}"
echo.

echo "🎯 Étape 9: Test complet A-Z..."
curl -X POST http://localhost:3001/api/test/complete-audit -H "Content-Type: application/json" -d "{\"action\":\"run_complete_test\"}"
echo.

echo "✅ Test terminé !"
echo "📊 Consultez les résultats sur http://localhost:3001/admin/audit-test"
echo.
pause
