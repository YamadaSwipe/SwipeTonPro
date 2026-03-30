@echo off
echo 🔍 Test direct de l'API...
echo.
curl -X GET http://localhost:3000/api/test/complete-audit
echo.
echo.
echo 🔍 Test avec action simple...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"test\"}" http://localhost:3000/api/test/complete-audit
echo.
pause
