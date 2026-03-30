@echo off
echo 🚀 Lancement du test complet d'audit SwipeTonPro...
echo.

echo 📋 Étape 1: Création des comptes professionnels...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"create_professionals\"}" http://localhost:3000/api/test/complete-audit
echo ✅ Comptes professionnels créés

echo 👤 Étape 2: Création des comptes clients...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"create_clients\"}" http://localhost:3000/api/test/complete-audit
echo ✅ Comptes clients créés

echo 📋 Étape 3: Création des projets...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"create_projects\"}" http://localhost:3000/api/test/complete-audit
echo ✅ Projets créés

echo 🤝 Étape 4: Simulation du matching...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"simulate_matching\"}" http://localhost:3000/api/test/complete-audit
echo ✅ Matching simulé

echo 💬 Étape 5: Simulation des dialogues...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"simulate_dialogue\"}" http://localhost:3000/api/test/complete-audit
echo ✅ Dialogues simulées

echo 💳 Étape 6: Simulation des paiements...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"simulate_payment\"}" http://localhost:3000/api/test/complete-audit
echo ✅ Paiements simulés

echo 📅 Étape 7: Simulation du planning...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"simulate_planning\"}" http://localhost:3000/api/test/complete-audit
echo ✅ Planning simulé

echo 👮 Étape 8: Validation admin...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"validate_admin\"}" http://localhost:3000/api/test/complete-audit
echo ✅ Validation admin terminée

echo 🎯 Étape 9: Test complet A-Z...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"run_complete_test\"}" http://localhost:3000/api/test/complete-audit
echo ✅ Test complet terminé avec succès !
echo 📊 Consultez les résultats sur http://localhost:3000/admin/audit-test

echo.
echo 🎉 Test terminé !
pause
