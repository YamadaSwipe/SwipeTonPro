# 🎨 Guide - Correction Terminal Noir sur Noir

## 🚨 **Problème**
Terminal PowerShell affiche du texte noir sur fond noir → illisible

## 🔧 **Solutions immédiates**

### **Option 1: Windows Terminal (Recommandé)**
1. **Installer Windows Terminal** depuis Microsoft Store
2. **Ouvrir Windows Terminal** au lieu de PowerShell classique
3. **Configurer les couleurs** dans les paramètres

### **Option 2: PowerShell avec couleurs**
```powershell
# Changer les couleurs du profil PowerShell
$Host.UI.RawUI.ForegroundColor = "White"
$Host.UI.RawUI.BackgroundColor = "Black"
Clear-Host
```

### **Option 3: Utiliser CMD classique**
```cmd
cmd /c "color 0F"
```

### **Option 4: Script automatique**
Exécutez le fichier créé :
```cmd
fix-terminal-colors.bat
```

## 🎯 **Codes couleur CMD**
| Code | Couleur | Usage |
|------|---------|-------|
| 0F | Noir sur Blanc | ✅ Recommandé |
| 0A | Noir sur Vert | ✅ Très lisible |
| 0B | Noir sur Cyan | ✅ Contraste élevé |
| 0E | Noir sur Jaune | ⚠️ Fatigant |
| 1F | Bleu sur Blanc | ✅ Professionnel |

## 🖥️ **Solution permanente**

### **Windows Terminal (Meilleure option)**
1. **Télécharger** : `winget install Microsoft.WindowsTerminal`
2. **Configurer** : Ouvrir les paramètres (Ctrl+,)
3. **Couleurs** : Choisir un thème clair

### **PowerShell Profile**
```powershell
# Créer un profil permanent
if (!(Test-Path $PROFILE)) { New-Item -Path $PROFILE -ItemType File -Force }

# Ajouter au profil
Add-Content $PROFILE @"
$Host.UI.RawUI.ForegroundColor = "White"
$Host.UI.RawUI.BackgroundColor = "Black"
Clear-Host
"@

# Recharger le profil
. $PROFILE
```

## 🚀 **Test rapide**

Pour vérifier que les couleurs fonctionnent :
```cmd
echo ✅ Test des couleurs
echo 🔴 Rouge
echo 🟢 Vert  
echo 🔵 Bleu
```

## 💡 **Conseils**

- **Windows Terminal** est la meilleure solution à long terme
- **Évitez CMD classique** pour le développement moderne
- **Sauvegardez vos préférences** dans un profil PowerShell
- **Utilisez des thèmes clairs** pour éviter la fatigue visuelle

---

**Pour tester immédiatement :**
```cmd
cmd /c "color 0F" && echo ✅ Terminal reconfiguré !
```
