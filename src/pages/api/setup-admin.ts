// API pour créer le vrai compte admin
// À exécuter une seule fois pour initialiser l'admin
// SÉCURISÉ: Désactivé en production pour éviter les abus

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

type AdminAuthUser = {
  id: string;
  email?: string | null;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // SÉCURITÉ: Désactiver en production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SÉCURITÉ: token de bootstrap requis (évite un endpoint ouvert en dev)
  const setupToken = process.env.SETUP_ADMIN_TOKEN;
  const providedToken = req.headers['x-setup-token'];
  if (!setupToken || providedToken !== setupToken) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const adminEmail = process.env.SETUP_ADMIN_EMAIL;
  const adminPassword = process.env.SETUP_ADMIN_PASSWORD;
  const normalizedAdminEmail = adminEmail?.toLowerCase();

  if (!adminEmail || !adminPassword) {
    return res.status(503).json({ error: 'Setup unavailable' });
  }

  try {
    let userId: string | null = null;

    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Super Admin',
        role: 'super_admin'
      }
    });

    if (authError && !authError.message?.includes('already registered')) {
      console.error('❌ Erreur création utilisateur auth:', authError);
      return res.status(500).json({ error: 'Erreur création utilisateur auth', details: authError.message });
    }

    if (authData.user?.id) {
      userId = authData.user.id;
    } else {
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

      if (usersError) {
        console.error('❌ Erreur récupération utilisateur auth:', usersError);
        return res.status(500).json({ error: 'Erreur récupération utilisateur auth', details: usersError.message });
      }

      const users = (usersData?.users ?? []) as AdminAuthUser[];
      userId =
        users.find(
          (user) => user.email?.toLowerCase() === normalizedAdminEmail
        )?.id ?? null;
    }

    if (!userId) {
      return res.status(500).json({ error: 'Impossible de déterminer le compte admin' });
    }

    // 2. Créer ou mettre à jour le profil dans profiles
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: adminEmail,
        full_name: 'Super Admin',
        role: 'super_admin',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Erreur création profil:', profileError);
      return res.status(500).json({ error: 'Erreur création profil', details: profileError.message });
    }

    console.log('✅ Compte admin créé avec succès');

    return res.status(200).json({
      success: true,
      message: 'Compte admin créé avec succès',
      user: {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role
      }
    });

  } catch (error) {
    console.error('❌ Erreur setup admin:', error);
    return res.status(500).json({ error: 'Erreur serveur', details: error });
  }
}
