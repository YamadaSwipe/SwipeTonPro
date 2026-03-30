// Mode dégradé pour éviter les erreurs Supabase
export const supabase = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase inaccessible') }),
    signOut: () => Promise.resolve({ error: null }),
    signIn: () => Promise.resolve({ data: null, error: new Error('Supabase inaccessible') }),
    signUp: () => Promise.resolve({ data: null, error: new Error('Supabase inaccessible') }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: new Error('Supabase inaccessible') }),
        single: () => Promise.resolve({ data: null, error: new Error('Supabase inaccessible') }),
      }),
      or: () => ({
        order: () => Promise.resolve({ data: [], error: new Error('Supabase inaccessible') }),
      }),
      is: () => ({
        eq: () => Promise.resolve({ data: [], error: new Error('Supabase inaccessible') }),
      }),
    }),
    insert: () => Promise.resolve({ data: null, error: new Error('Supabase inaccessible') }),
    update: () => Promise.resolve({ data: null, error: new Error('Supabase inaccessible') }),
    delete: () => Promise.resolve({ data: null, error: new Error('Supabase inaccessible') }),
  }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: new Error('Supabase inaccessible') }),
      getPublicUrl: () => ({ data: { publicUrl: '' }, error: new Error('Supabase inaccessible') }),
    }),
  },
};
