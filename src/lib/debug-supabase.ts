// Utilitaire de debug pour la connexion Supabase
export const debugSupabaseConnection = async () => {
  console.log('🔍 Debug Supabase Connection');
  
  // Vérification des variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('📋 Variables check:');
  console.log('- URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('- ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variables manquantes!');
    return false;
  }
  
  // Test de connexion
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('🌐 Test de connexion à:', supabaseUrl);
    
    // Test simple: récupérer la session courante
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      return false;
    }
    
    console.log('✅ Connexion Supabase établie');
    return true;
    
  } catch (err) {
    console.error('❌ Erreur critique:', err);
    return false;
  }
};

// Fonction pour valider l'URL Supabase
export const validateSupabaseUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase.co');
  } catch {
    return false;
  }
};
