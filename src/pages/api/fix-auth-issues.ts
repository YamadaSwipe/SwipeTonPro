import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { action, email, newPassword } = req.body;

  if (!action || !email) {
    return res.status(400).json({ error: 'Action et email requis' });
  }

  try {
    console.log(`🔧 Action: ${action} pour ${email}`);

    const results: any = {
      action,
      email,
      timestamp: new Date().toISOString(),
      steps: [],
      success: false
    };

    switch (action) {
      case 'diagnose':
        results.steps.push('🔍 Vérification utilisateur dans auth.users...');
        const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) {
          results.steps.push(`❌ Erreur liste users: ${listError.message}`);
          break;
        }

        const authUser = authUsers.users.find((u: any) => u.email === email);
        results.authUser = authUser ? {
          id: authUser.id,
          email: authUser.email,
          email_confirmed_at: authUser.email_confirmed_at,
          last_sign_in_at: authUser.last_sign_in_at,
          created_at: authUser.created_at
        } : null;

        results.steps.push(authUser ? '✅ Utilisateur trouvé dans auth.users' : '❌ Utilisateur NON trouvé dans auth.users');

        results.steps.push('👤 Vérification profil dans profiles...');
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        results.profile = profile || null;
        results.profileError = profileError?.message || null;
        results.steps.push(profile ? '✅ Profil trouvé' : '❌ Profil NON trouvé');

        if (newPassword) {
          results.steps.push('🧪 Test de connexion avec le mot de passe fourni...');
          const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password: newPassword
          });

          if (signInError) {
            results.steps.push(`❌ Échec connexion: ${signInError.message}`);
            results.signInTest = { success: false, error: signInError.message };
          } else {
            results.steps.push('✅ Connexion réussie !');
            results.signInTest = { success: true };
            await supabaseAdmin.auth.signOut();
          }
        }

        results.success = true;
        break;

      case 'reset-password':
        results.steps.push(`🔐 Réinitialisation mot de passe pour ${email}...`);
        
        if (!newPassword) {
          results.steps.push('❌ Nouveau mot de passe requis');
          break;
        }

        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        const userToReset = usersList.users.find((u: any) => u.email === email);

        if (!userToReset) {
          results.steps.push('❌ Utilisateur non trouvé');
          break;
        }

        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userToReset.id,
          { password: newPassword }
        );

        if (updateError) {
          results.steps.push(`❌ Erreur mise à jour: ${updateError.message}`);
          results.success = false;
        } else {
          results.steps.push('✅ Mot de passe réinitialisé avec succès');
          results.success = true;

          const { error: testError } = await supabaseAdmin.auth.signInWithPassword({
            email,
            password: newPassword
          });

          if (testError) {
            results.steps.push(`⚠️ Test connexion échoué: ${testError.message}`);
          } else {
            results.steps.push('✅ Test connexion réussie avec nouveau mot de passe');
            await supabaseAdmin.auth.signOut();
          }
        }
        break;

      case 'create-missing-profile':
        results.steps.push(`👤 Création profil manquant pour ${email}...`);
        
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const userForProfile = existingUser.users.find((u: any) => u.email === email);

        if (!userForProfile) {
          results.steps.push('❌ Utilisateur non trouvé dans auth.users');
          break;
        }

        const { data: existingProfile, error: checkError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (existingProfile) {
          results.steps.push('ℹ️ Profil existe déjà');
          results.success = true;
          break;
        }

        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userForProfile.id,
            email: userForProfile.email,
            role: email === 'admin@swipetonpro.fr' ? 'super_admin' : 'client',
            created_at: userForProfile.created_at,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          results.steps.push(`❌ Erreur création profil: ${createError.message}`);
          results.success = false;
        } else {
          results.steps.push('✅ Profil créé avec succès');
          results.success = true;
          results.createdProfile = newProfile;
        }
        break;

      default:
        results.steps.push(`❌ Action inconnue: ${action}`);
        break;
    }

    return res.status(200).json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('❌ Erreur fix auth issues:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
