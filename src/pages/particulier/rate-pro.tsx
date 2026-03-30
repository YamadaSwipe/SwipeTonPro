import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";

import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useAuth } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RateProPage() {
  const router = useRouter();
  const { projectId } = router.query;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<any>(null);

  useEffect(() => {
    if (projectId && user) {
      loadProjectDetails();
    }
  }, [projectId, user]);

  const loadProjectDetails = async () => {
    // Ensure projectId is a string
    const pId = Array.isArray(projectId) ? projectId[0] : projectId;
    if (!pId) return;

    try {
      // Fetch project and the accepted professional
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          project_interests!inner(
            professional_id,
            professionals(company_name)
          )
        `)
        .eq("id", pId)
        .eq("client_id", user?.id)
        .eq("project_interests.status", "accepted")
        .single();

      if (error) throw error;
      setProjectData(data);
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p>Projet introuvable ou vous n'avez pas les droits.</p>
        <Link href="/particulier/dashboard">
          <Button>Retour au tableau de bord</Button>
        </Link>
      </div>
    );
  }

  const professional = projectData.project_interests[0].professionals;
  const professionalId = projectData.project_interests[0].professional_id;

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <SEO title="Noter le professionnel - SwipeTonPro" />
      <div className="min-h-screen bg-gray-50 py-12">
        <main className="container mx-auto px-4 max-w-2xl">
          <Link href="/particulier/dashboard" className="inline-block mb-6">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle>Noter votre expérience</CardTitle>
              <CardDescription>
                Projet : <span className="font-medium text-foreground">{projectData.title}</span>
                <br />
                Professionnel : <span className="font-medium text-foreground">{professional.company_name}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewForm
                projectId={Array.isArray(projectId) ? projectId[0] : projectId!}
                professionalId={professionalId}
                clientId={user!.id}
                onSuccess={() => router.push("/particulier/dashboard")}
                onCancel={() => router.push("/particulier/dashboard")}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}