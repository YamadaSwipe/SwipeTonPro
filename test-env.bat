@echo off
echo Test des variables d'environnement...
echo.
echo NEXT_PUBLIC_SUPABASE_URL=%NEXT_PUBLIC_SUPABASE_URL%
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=%NEXT_PUBLIC_SUPABASE_ANON_KEY%
echo.
echo Test de l'API avec les variables actuelles...
curl -X POST -H "Content-Type: application/json" -d "{\"action\": \"test_env\"}" http://localhost:3001/api/test/complete-audit
echo.
pause
