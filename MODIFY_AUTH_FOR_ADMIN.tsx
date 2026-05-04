// =====================================================
// MODIFICATION AUTHCONTEXT - Support admin fantôme
// Ajoutez ce code dans votre AuthContext.tsx
// =====================================================

// Dans la fonction getCurrentUser(), ajoutez après la récupération de l'utilisateur:

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour obtenir l'utilisateur courant
  const getCurrentUser = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Erreur auth:', error);
        return null;
      }

      // === CONTOURNEMENT ADMIN FANTÔME ===
      // Si l'utilisateur n'existe pas dans auth.users mais existe dans profiles
      if (!authUser) {
        // Vérifier si on a un admin fantôme dans profiles
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .single();
        
        if (adminProfile) {
          console.log('🔧 Admin fantôme détecté');
          return {
            id: adminProfile.id,
            email: adminProfile.email,
            full_name: adminProfile.full_name,
            role: adminProfile.role
          };
        }
      }
      
      // === LOGIQUE NORMALE ===
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (profile) {
          return {
            id: authUser.id,
            email: authUser.email || '',
            full_name: profile.full_name || '',
            role: profile.role || 'client'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erreur getCurrentUser:', error);
      return null;
    }
  };

  // === CONTOURNEMENT POUR LOGIN ADMIN ===
  // Dans la fonction login, ajoutez:
  const login = async (email: string, password: string) => {
    try {
      // Si c'est l'admin fantôme, bypass Supabase Auth
      if (email === 'admin@swipotonpro.fr' && password === 'Admin123!') {
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .single();
        
        if (adminProfile) {
          setUser({
            id: adminProfile.id,
            email: adminProfile.email,
            full_name: adminProfile.full_name,
            role: adminProfile.role
          });
          
          // Redirection directe
          window.location.href = '/admin/dashboard';
          return { user: adminProfile, error: null };
        }
      }
      
      // === LOGIQUE NORMALE POUR LES AUTRES UTILISATEURS ===
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const authUser = {
          id: data.user.id,
          email: data.user.email || '',
          full_name: profile?.full_name || '',
          role: profile?.role || 'client'
        };

        setUser(authUser);
        return { user: authUser, error: null };
      }

      return { user: null, error: { message: 'Utilisateur non trouvé' } };
    } catch (error) {
      return { user: null, error: { message: 'Erreur de connexion' } };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
