# 🔧 Guide de Correction - Erreur Tickets de Support

## 📋 Problème Identifié

Lorsqu'un utilisateur essaie d'envoyer un message depuis le formulaire de contact, il reçoit l'erreur :
```
"Erreur lors de la creation du ticket de support"
```

### Cause Racine

Le trigger `notify_admins_new_support_ticket()` dans la base de données essaie d'accéder à la table `auth.users` avec une jointure, ce qui cause une erreur de permission :
```
permission denied for table users
Code: 42501
```

Le problème vient de cette requête dans le trigger :
```sql
SELECT u.id, p.email
FROM auth.users u
INNER JOIN public.profiles p ON u.id = p.user_id
WHERE p.role IN ('admin', 'moderator')
```

## ✅ Solution

Modifier le trigger pour utiliser uniquement la table `profiles` qui contient déjà toutes les informations nécessaires.

## 🛠️ Application de la Correction

### Option 1 : Via l'Interface Supabase (RECOMMANDÉ)

1. **Connectez-vous à votre dashboard Supabase**
   - URL : https://app.supabase.com
   - Sélectionnez votre projet

2. **Ouvrez l'éditeur SQL**
   - Menu latéral → SQL Editor
   - Cliquez sur "New query"

3. **Copiez et exécutez le script SQL suivant :**

```sql
-- Supprimer l'ancien trigger et fonction
DROP TRIGGER IF EXISTS trigger_notify_admins_new_support_ticket ON public.support_tickets;
DROP FUNCTION IF EXISTS notify_admins_new_support_ticket();

-- Créer la nouvelle fonction corrigée
CREATE OR REPLACE FUNCTION notify_admins_new_support_ticket()
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  notification_id UUID;
BEGIN
  -- Créer une notification pour chaque administrateur
  -- Utiliser uniquement la table profiles (pas auth.users)
  FOR admin_record IN 
    SELECT user_id, email
    FROM public.profiles
    WHERE role IN ('admin', 'moderator')
    AND email IS NOT NULL
  LOOP
    -- Insérer une notification dans la table notifications
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      link,
      metadata,
      created_at
    ) VALUES (
      admin_record.user_id,
      'support_ticket',
      'Nouveau ticket de support',
      format('Nouveau message de support de %s: %s', NEW.name, NEW.subject),
      '/admin/support-tickets/' || NEW.id::text,
      jsonb_build_object(
        'ticket_id', NEW.id,
        'sender_name', NEW.name,
        'sender_email', NEW.email,
        'subject', NEW.subject,
        'request_type', NEW.request_type
      ),
      NOW()
    ) RETURNING id INTO notification_id;
    
    -- Log de la notification créée
    RAISE NOTICE 'Notification créée pour admin % (ticket %)', admin_record.user_id, NEW.id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
CREATE TRIGGER trigger_notify_admins_new_support_ticket
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_support_ticket();
```

4. **Cliquez sur "Run" pour exécuter le script**

5. **Vérifiez que le trigger est bien créé :**

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_notify_admins_new_support_ticket';
```

### Option 2 : Via Script Node.js (Alternative)

Si vous préférez utiliser un script automatisé :

```bash
node apply-fix-support-tickets.js
```

Ce script :
- Lit le fichier SQL de correction
- Applique les modifications à la base de données
- Teste la création d'un ticket
- Vérifie que les notifications sont créées

## 🧪 Test de la Correction

### Test Manuel

1. **Allez sur la page de contact de votre application**
   - URL : `http://localhost:3000/contact` (en développement)
   - Ou votre URL de production

2. **Remplissez le formulaire avec des données de test :**
   - Nom : Test User
   - Email : test@example.com
   - Téléphone : 0612345678
   - Sujet : Test après correction
   - Message : Test de création de ticket

3. **Soumettez le formulaire**

4. **Vérifiez le résultat :**
   - ✅ Le message "Message envoyé avec succès" devrait s'afficher
   - ✅ Aucune erreur dans la console du navigateur
   - ✅ Le ticket devrait être visible dans l'admin : `/admin/support-tickets`

### Test Automatisé

Exécutez le script de test :

```bash
node test-support-tickets-table.js
```

Résultat attendu :
```
✅ La table support_tickets existe
✅ Ticket créé avec succès
✅ Notification créée avec succès
✅ Ticket de test supprimé
```

## 📊 Vérification dans la Base de Données

### Vérifier les tickets créés

```sql
SELECT 
  id,
  name,
  email,
  subject,
  status,
  created_at
FROM public.support_tickets
ORDER BY created_at DESC
LIMIT 10;
```

### Vérifier les notifications créées

```sql
SELECT 
  n.id,
  n.title,
  n.message,
  n.created_at,
  p.email as admin_email
FROM public.notifications n
JOIN public.profiles p ON n.user_id = p.user_id
WHERE n.type = 'support_ticket'
ORDER BY n.created_at DESC
LIMIT 10;
```

## 🔍 Diagnostic en Cas de Problème

### Si l'erreur persiste

1. **Vérifiez que le trigger a bien été mis à jour :**

```sql
SELECT 
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'notify_admins_new_support_ticket'
AND n.nspname = 'public';
```

La fonction ne devrait PAS contenir de référence à `auth.users`.

2. **Vérifiez les logs de l'API :**

Dans le terminal où tourne votre serveur Next.js, vous devriez voir :
```
✅ Ticket de support créé: [UUID]
📧 X/Y emails envoyés aux administrateurs
```

3. **Vérifiez qu'il y a des administrateurs dans la base :**

```sql
SELECT 
  user_id,
  email,
  role
FROM public.profiles
WHERE role IN ('admin', 'moderator')
AND email IS NOT NULL;
```

Si aucun admin n'est trouvé, les notifications ne seront pas créées (mais le ticket sera quand même créé).

## 📝 Résumé des Changements

### Avant (❌ Problématique)
```sql
FOR admin_record IN 
  SELECT u.id, p.email
  FROM auth.users u
  INNER JOIN public.profiles p ON u.id = p.user_id
  WHERE p.role IN ('admin', 'moderator')
```

### Après (✅ Corrigé)
```sql
FOR admin_record IN 
  SELECT user_id, email
  FROM public.profiles
  WHERE role IN ('admin', 'moderator')
  AND email IS NOT NULL
```

## 🎯 Avantages de la Correction

1. ✅ **Plus d'erreur de permission** - N'accède plus à `auth.users`
2. ✅ **Plus simple** - Utilise uniquement la table `profiles`
3. ✅ **Plus performant** - Pas de jointure nécessaire
4. ✅ **Plus fiable** - Toutes les données sont dans `profiles`

## 📞 Support

Si vous rencontrez toujours des problèmes après avoir appliqué cette correction :

1. Vérifiez les logs de l'API Next.js
2. Vérifiez les logs de Supabase (Dashboard → Logs)
3. Testez avec le script `test-support-tickets-table.js`
4. Consultez le fichier `GUIDE_SYSTEME_SUPPORT_TICKETS.md` pour plus de détails

---

**Date de création :** 18/06/2026  
**Dernière mise à jour :** 18/06/2026  
**Version :** 1.0
