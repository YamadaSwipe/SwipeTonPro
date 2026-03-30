# Nettoyage Complet - Windows

## Problème
La commande `rm` n'existe pas sur Windows

## Solution Windows

### Option 1: PowerShell (Recommandé)
```powershell
# Supprimer les dossiers
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules

# Réinstaller
npm install
npm run dev
```

### Option 2: Manuel
1. **Supprimer manuellement** dans l'explorateur :
   - Dossier `.next`
   - Dossier `node_modules`

2. **Dans le terminal** :
   ```cmd
   npm install
   npm run dev
   ```

### Option 3: Commande Windows
```cmd
# Supprimer avec rmdir
rmdir /s /q .next
rmdir /s /q node_modules

# Réinstaller
npm install
npm run dev
```

## Problème de fond
L'erreur `private-next-pages/_app` indique un problème profond avec Next.js 15.5.7

### Solution alternative
Si ça ne fonctionne pas, downgrader Next.js :
```bash
npm install next@14.2.5
```
