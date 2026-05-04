# Configuration SMTP pour Supabase Auth

## ⚠️ Important
La configuration SMTP de Supabase Auth **ne peut PAS être faite en SQL pur**.
Elle se configure via l'API Supabase ou le Dashboard.

## Méthode 1: Via le Dashboard Supabase (Recommandé)

1. Connectez-vous au dashboard: https://app.supabase.com
2. Allez dans **Authentication** → **Email Templates**
3. Activez **Enable Custom SMTP**
4. Remplissez les paramètres:
   - **SMTP Host**: smtp.gmail.com (ou votre provider)
   - **SMTP Port**: 587 (TLS) ou 465 (SSL)
   - **SMTP User**: votre_email@gmail.com
   - **SMTP Password**: [App Password si Gmail]
   - **Sender Name**: Swipe Ton Pro
   - **Sender Email**: noreply@votredomaine.com

## Méthode 2: Via l'API Supabase (CLI / curl)

```bash
# Remplacez par vos vraies valeurs
SUPABASE_PROJECT_ID=votre_project_id
SUPABASE_ACCESS_TOKEN=votre_token_admin

curl -X PUT "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "smtp_enabled": true,
    "smtp_host": "smtp.gmail.com",
    "smtp_port": "587",
    "smtp_user": "votre_email@gmail.com",
    "smtp_pass": "votre_app_password",
    "smtp_max_frequency": 60,
    "smtp_sender_name": "Swipe Ton Pro",
    "smtp_sender_email": "noreply@swipetonpro.fr"
  }'
```

## Méthode 3: Via supabase-js (Admin API)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Note: La mise à jour SMTP via l'API client n'est pas exposée publiquement.
// Utilisez l'API Management (https://api.supabase.com) ou le CLI.
```

## Méthode 4: Via Supabase CLI (local/dev)

```bash
supabase config set auth.email.smtp.host=smtp.gmail.com
supabase config set auth.email.smtp.port=587
supabase config set auth.email.smtp.user=votre_email@gmail.com
supabase config set auth.email.smtp.pass=votre_app_password
supabase config set auth.email.smtp.admin_email=noreply@swipetonpro.fr
supabase config set auth.email.smtp.sender_name="Swipe Ton Pro"
```

## Configuration Gmail (App Password)

Si vous utilisez Gmail:
1. Activez la 2FA sur votre compte Google
2. Générez un **App Password** ici: https://myaccount.google.com/apppasswords
3. Utilisez cet App Password comme `SMTP_PASS` (PAS votre vrai mot de passe)

## Vérification après configuration

Testez l'envoi d'email via:
```bash
curl -X POST "${SUPABASE_URL}/auth/v1/resend" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"type": "signup", "email": "test@example.com"}'
```

## Fallback actuel (sans SMTP)

L'application utilise une **route API interne** (`/api/auth/reset-password`) qui bypass SMTP en générant directement le lien de réinitialisation via l'Admin API Supabase.

Ce système fonctionne mais n'est pas idéal en production.

## Sécurité

- Ne stockez JAMAIS de credentials SMTP en clair dans le code
- Utilisez des variables d'environnement ou Vault
- En production, préférez un service dédié: SendGrid, Mailgun, AWS SES
