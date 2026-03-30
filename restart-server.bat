@echo off
echo 🔄 Redémarrage du serveur avec les variables d'environnement...
echo.
echo Arrêt du processus actuel...
taskkill /f /im node.exe 2>nul
timeout /t 2 >nul
echo.
echo Démarrage du serveur avec les variables...
start cmd /k "npm run dev"
echo.
echo ⏳ Attente de 10 secondes pour que le serveur démarre...
timeout /t 10 >nul
echo.
echo 🧪 Test de l'API...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"test_env\"}" http://localhost:3001/api/test/complete-audit
echo.
echo ✅ Serveur redémarré ! Vous pouvez maintenant lancer l'audit complet.
echo.
pause
