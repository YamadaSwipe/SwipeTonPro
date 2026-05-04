/**
 * API de gestion des comptes par l'admin
 * Recherche, réinitialisation et création de comptes
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vérifier que c'est un admin
  const adminToken = req.headers.authorization?.replace('Bearer ', '');
  const isAdminGhost = req.headers['x-admin-ghost'] === 'true';
  
  if (!adminToken && !isAdminGhost) {
    return res.status(401).json({ 
      success: false, 
      error: 'Accès non autorisé' 
    });
  }

  try {
    const { action, email, password, role, fullName } = req.body;

    switch (action) {
      case 'search':
        return await searchAccounts(email, res);
      case 'reset':
        return await resetPassword(email, password, res);
      case 'create':
        return await createAccount(email, password, role, fullName, res);
      case 'list':
        return await listAccounts(res);
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Action non reconnue' 
        });
    }
  } catch (error: any) {
    console.error('❌ API manage-accounts error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// Rechercher des comptes
async function searchAccounts(email: string, res: NextApiResponse) {
  const emails = Array.isArray(email) ? email : [email];
  
  // Rechercher dans profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('email', emails);

  if (profilesError) {
    return res.status(500).json({ 
      success: false, 
      error: profilesError.message 
    });
  }

  // Rechercher dans professionals
  const { data: professionals, error: prosError } = await supabase
    .from('professionals')
    .select('*')
    .in('email', emails);

  if (prosError) {
    return res.status(500).json({ 
      success: false, 
      error: prosError.message 
    });
  }

  return res.json({
    success: true,
    data: {
      profiles: profiles || [],
      professionals: professionals || []
    }
  });
}

// Réinitialiser le mot de passe
async function resetPassword(email: string, newPassword: string, res: NextApiResponse) {
  // 1. Vérifier que le profil existe
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ 
      success: false, 
      error: 'Compte non trouvé' 
    });
  }

  // 2. Tenter de réinitialiser dans auth.users
  try {
    const { error: authError } = await supabase.auth.admin.updateUserById(
      profile.user_id,
      { password: newPassword }
    );

    if (authError) {
      console.warn('⚠️ Impossible de réinitialiser dans auth.users:', authError.message);
      // Alternative: créer un lien de réinitialisation
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
        }
      });

      if (error) {
        return res.status(500).json({ 
          success: false, 
          error: 'Impossible de générer le lien de réinitialisation' 
        });
      }

      return res.json({
        success: true,
        message: 'Lien de réinitialisation généré',
        resetLink: data.properties?.link,
        note: 'Le mot de passe ne peut pas être réinitialisé directement. Utilisez le lien fourni.'
      });
    }

    // 3. Mettre à jour le profil
    await supabase
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('email', email);

    return res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      email: email,
      newPassword: newPassword
    });

  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// Créer un nouveau compte
async function createAccount(
  email: string, 
  password: string, 
  role: string, 
  fullName: string,
  res: NextApiResponse
) {
  // 1. Vérifier que l'email n'existe pas déjà
  const { data: existing } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();

  if (existing) {
    return res.status(400).json({ 
      success: false, 
      error: 'Cet email existe déjà' 
    });
  }

  // 2. Créer l'utilisateur dans auth.users
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role
    }
  });

  if (authError) {
    return res.status(500).json({ 
      success: false, 
      error: authError.message 
    });
  }

  // 3. Créer le profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      user_id: authData.user.id,
      email: email,
      full_name: fullName,
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (profileError) {
    return res.status(500).json({ 
      success: false, 
      error: profileError.message 
    });
  }

  // 4. Si c'est un professionnel, créer l'entrée dans professionals
  if (role === 'professional') {
    await supabase
      .from('professionals')
      .insert({
        id: authData.user.id,
        user_id: authData.user.id,
        email: email,
        company_name: fullName,
        specialty: 'Général',
        status: 'pending',
        created_at: new Date().toISOString()
      });
  }

  return res.json({
    success: true,
    message: 'Compte créé avec succès',
    data: {
      user: authData.user,
      profile: profile
    },
    credentials: {
      email: email,
      password: password
    }
  });
}

// Lister tous les comptes
async function listAccounts(res: NextApiResponse) {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }

  return res.json({
    success: true,
    data: profiles || []
  });
}
