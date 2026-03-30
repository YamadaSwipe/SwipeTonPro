@echo off
echo 🔧 Correction du fichier .env.local...
echo.

# Suppression de l'ancien fichier
del .env.local

# Création du nouveau fichier avec le bon format
echo # Supabase Configuration > .env.local
echo NEXT_PUBLIC_SUPABASE_URL=https://qhuvnpmqlucpjdslnfui.supabase.co >> .env.local
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodXZucG1xbHVjcGpkc2xuZnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDM1MjYsImV4cCI6MjA4NzUxOTUyNn0.KZIdHPyxjArRY5RLHBeAm_CzU-zOPM97fj1XKR9SRbw >> .env.local
echo. >> .env.local
echo # Site Configuration >> .env.local
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000 >> .env.local
echo NEXT_PUBLIC_VERCEL_URL= >> .env.local

echo ✅ Fichier .env.local corrigé !
echo.
echo 🔄 Veuillez redémarrer le serveur maintenant
pause
