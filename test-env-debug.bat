@echo off
echo 🔍 Test des variables d'environnement...
echo.
echo Test direct de l'API...
curl -X GET http://localhost:3001/api/test/complete-audit
echo.
pause
