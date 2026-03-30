@echo off
echo Vérification du serveur...
curl -s http://localhost:3001/api/health
if %errorlevel% equ 0 (
    echo ✅ Serveur démarré
) else (
    echo ❌ Serveur non démarré
    echo Démarrage du serveur...
    start cmd /k "npm run dev"
)
pause
