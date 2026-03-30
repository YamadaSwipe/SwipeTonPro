import { createClient } from '@/integrations/supabase/server';
import { notFound, redirect } from 'next/navigation';
import ProjetDashboard from '@/components/dashboard/ProjetDashboard';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjetPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Récupérer les détails du projet
  const projet = await supabase
    .from('projects')
    .select(`
      id,
      title,
      description,
      budget_min,
      budget_max,
      status,
      created_at,
      updated_at,
      client:profiles!projects_client_id_fkey(id, email, full_name),
      assigned_professional:profiles!projects_assigned_to_fkey(id, email, full_name)
    `)
    .eq('id', id)
    .single();

  if (!projet) {
    notFound();
  }

  // Vérifier que l'utilisateur a accès à ce projet
  if (projet.data?.client?.id !== user.id && projet.data?.assigned_professional?.[0]?.id !== user.id) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6">
      <ProjetDashboard projetId={id} userId={user.id} />
    </div>
  );
}
