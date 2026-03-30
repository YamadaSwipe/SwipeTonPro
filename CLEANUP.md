# Nettoyage Cache Next.js

## Problème
Cache corrompu après modifications de configuration

## Solution
1. Arrêter le serveur (Ctrl+C)
2. Supprimer le dossier .next
3. Redémarrer le serveur

## Commandes Windows
```cmd
# Arrêter le serveur
Ctrl+C

# Supprimer le cache
rmdir /s .next

# Redémarrer
npm run dev
```

## Alternative (PowerShell)
```powershell
# Supprimer le cache
Remove-Item -Recurse -Force .next

# Redémarrer
npm run dev
```
