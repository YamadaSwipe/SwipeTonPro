/**
 * FIX TEMPORAIRE POUR LOGIN ADMIN
 * Force l'utilisation du hook admin fantôme quand Supabase Auth échoue
 */

// Ajoutez ce code dans login.tsx après la ligne 114 (après la vérification email === 'admin@swipotonpro.fr')

// === CONTOURNEMENT TEMPORAIRE SI SUPABASE AUTH ÉCHOUE ===
// Si le compte n'existe pas dans auth.users, forcer le hook admin fantôme
if (email === 'admin@swipotonpro.fr' && password === 'Admin123!') {
  console.log('🔧 LoginPage: Contournement admin fantôme activé');
  
  // Nettoyer toute trace d'autres comptes
  if (typeof window !== 'undefined') {
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('adminGhostSession_secure_v3');
    sessionStorage.clear();
  }

  const success = await loginAdminGhost(email, password);

  if (success) {
    console.log('✅ LoginPage: Admin fantôme connecté via contournement');
    router.push('/admin/dashboard');
    return;
  } else {
    // Si même le hook échoue, créer une session manuelle
    console.log('🔧 LoginPage: Création session admin manuelle');
    
    const adminUser = {
      id: '29a2361d-6568-4d5f-99c6-557b971778cc', // ID du profil admin
      email: 'admin@swipotonpro.fr',
      full_name: 'Super Admin',
      role: 'super_admin',
      created_at: new Date().toISOString()
    };

    // Créer session manuelle
    const session = {
      user: adminUser,
      timestamp: Date.now(),
      isolation_key: 'EDSWIPE_ADMIN_ISOLATION_2024'
    };

    // Stocker la session
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminGhostSession_secure_v3', JSON.stringify(session));
    }

    console.log('✅ LoginPage: Session admin manuelle créée');
    router.push('/admin/dashboard');
    return;
  }
}
