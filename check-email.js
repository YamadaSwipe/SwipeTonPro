const { createClient } = require('@supabase/supabase-js');

// Utiliser les valeurs connues
const supabaseUrl = 'https://qhuvnpmqlucpjdslnfui.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodXZucG1xbHVjcGpkc2xuZnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODA2NzQ3NCwiZXhwIjoyMDUzNjQzNDc0fQ.qR9s8a1L8A7x8o8J7g8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8x8';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEmail() {
  const email = 'sotbirida@yahoo.fr';
  
  console.log(`🔍 Recherche de l'email: ${email}`);
  
  try {
    // Vérifier dans auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur auth:', authError);
      return;
    }
    
    const foundUser = authUsers.users.find(user => user.email === email);
    
    if (foundUser) {
      console.log('✅ Utilisateur trouvé dans auth.users:');
      console.log('- ID:', foundUser.id);
      console.log('- Email:', foundUser.email);
      console.log('- Created at:', foundUser.created_at);
      console.log('- Email confirmed:', foundUser.email_confirmed_at ? 'Oui' : 'Non');
      
      // Vérifier dans profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', foundUser.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('❌ Erreur profile:', profileError);
      } else if (profile) {
        console.log('✅ Profil trouvé dans profiles:');
        console.log('- Full name:', profile.full_name);
        console.log('- Role:', profile.role);
        console.log('- Phone:', profile.phone);
      } else {
        console.log('❌ Profil NON trouvé dans profiles');
      }
      
      // Vérifier dans professionals
      const { data: professional, error: profError } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', foundUser.id)
        .single();
        
      if (profError && profError.code !== 'PGRST116') {
        console.error('❌ Erreur professional:', profError);
      } else if (professional) {
        console.log('✅ Profil professionnel trouvé:');
        console.log('- Company:', professional.company_name);
        console.log('- SIRET:', professional.siret);
      } else {
        console.log('❌ Profil professionnel NON trouvé');
      }
      
    } else {
      console.log('❌ Utilisateur NON trouvé dans auth.users');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkEmail();
