# 🌐 Test en Réseau Local

## Configuration pour tester l'application depuis d'autres appareils

### 🚀 Démarrage rapide

#### Option 1: Script automatique (recommandé)
```bash
npm run dev:network
```

#### Option 2: Manuel
```bash
npm run dev:ip
```

#### Option 3: Ancienne méthode (locale uniquement)
```bash
npm run dev
```

### 📱 Accès depuis d'autres appareils

1. **Téléphone mobile**
   - Connectez-vous au même WiFi que votre ordinateur
   - Ouvrez un navigateur et allez à l'adresse affichée dans la console
   - Exemple: `http://192.168.1.42:3000`

2. **Tablette ou autre ordinateur**
   - Même procédure que pour le téléphone
   - Assurez-vous d'être sur le même réseau

3. **Test responsive**
   - Utilisez les outils de développement de votre navigateur
   - Ou testez directement depuis votre mobile

### ⚠️ Configuration Pare-feu Windows

Si l'accès ne fonctionne pas, vous devez autoriser Node.js/Next.js dans le pare-feu :

1. **Ouvrir le Pare-feu Windows Defender**
2. **"Autoriser une application à travers le pare-feu"**
3. **Chercher "Node.js" ou "Node.js Runtime"**
4. **Cocher "Réseau privé" et "Réseau public"**
5. **Valider**

### 🔧 Dépannage

#### L'adresse IP ne s'affiche pas
```bash
# Vérifier votre IP manuellement
ipconfig
# Chercher "Adresse IPv4" sous votre carte réseau actuelle
```

#### Le port est déjà utilisé
```bash
# Changer de port
PORT=3001 npm run dev:ip
```

#### L'appareil ne se connecte pas
- Vérifiez que vous êtes sur le même WiFi
- Vérifiez le pare-feu Windows
- Essayez avec un autre navigateur

### 🌍 URL d'accès

L'application sera accessible sur :
- **Local**: `http://localhost:3000`
- **Réseau**: `http://[VOTRE_IP]:3000`

### 📝 Notes importantes

- Le mode réseau expose votre application à tous les appareils sur le même WiFi
- N'utilisez cette configuration qu'en développement
- En production, utilisez un vrai domaine et HTTPS
- Les variables d'environnement (.env.local) restent locales

### 🎯 Test des fonctionnalités

Une fois connecté depuis votre mobile, testez :
- Navigation responsive
- Formulaires d'inscription
- Upload de photos
- Dashboard admin
- Pages "Comment ça marche" et "Pourquoi nous" (avec boutons retour !)

---

**Bon test !** 🚀
