import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/router";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  title: string;
  city: string;
  status: string;
  validation_status: string;
  created_at: string;
  created_by_admin: boolean;
}

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  status: string;
  validation_status: string;
}

export default function AdminProjectValidation() {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [adminProjects, setAdminProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // redirect if not authorized
  useEffect(() => {
    (async () => {
      try {
        const session = await authService.getCurrentSession();
        if (!session) {
          router.replace("/auth/login");
          return;
        }
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          router.replace("/auth/login");
          return;
        }
        
        const allowed = ["admin", "super_admin", "support", "moderator", "team"];
        if (!profile || !allowed.includes(profile.role)) {
          router.replace("/auth/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/auth/login");
      }
    })();
  }, [router]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetails | null>(null);
  const [validationNotes, setValidationNotes] = useState("");
  const [validatingId, setValidatingId] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  // Si loadProjects échoue, essayer le fallback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && pendingProjects.length === 0 && adminProjects.length === 0) {
        console.log("Primary loading failed, trying fallback...");
        loadProjectsFallback();
      }
    }, 5000); // Attendre 5 secondes avant d'essayer le fallback

    return () => clearTimeout(timer);
  }, [loading, pendingProjects.length, adminProjects.length]);

  async function loadProjects() {
    try {
      setLoading(true);

      const [pendingRes, adminRes] = await Promise.all([
        adminService.getPendingProjects(),
        adminService.getAdminCreatedProjects()
      ]);

      if (pendingRes.data) {
        setPendingProjects(pendingRes.data);
      }

      if (adminRes.data) {
        setAdminProjects(adminRes.data);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Fallback si adminService ne fonctionne pas
  async function loadProjectsFallback() {
    try {
      setLoading(true);
      
      // Charger directement depuis Supabase
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .in("status", ["pending", "published"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPendingProjects(projects as any || []);
    } catch (error) {
      console.error("Error loading projects fallback:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleValidateProject(projectId: string) {
    setValidatingId(projectId);
    try {
      const result = await adminService.validateProject(projectId, validationNotes);

      if (result.success) {
        toast({
          title: "Succès",
          description: "Projet validé avec succès"
        });
        
        // Recharger les projets
        loadProjects();
        setSelectedProject(null);
        setValidationNotes("");
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setValidatingId(null);
    }
  }

  async function handleRejectProject(projectId: string) {
    setValidatingId(projectId);
    try {
      const result = await adminService.rejectProject(projectId, validationNotes);

      if (result.success) {
        toast({
          title: "Succès",
          description: "Projet rejeté"
        });
        
        // Recharger les projets
        loadProjects();
        setSelectedProject(null);
        setValidationNotes("");
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setValidatingId(null);
    }
  }

  const getValidationBadge = (status: string) => {
    switch (status) {
      case "validated":
        return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Brouillon</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Validation Projets">
        <p>Chargement...</p>
      </AdminLayout>
    );
  }

  return (
    <>
      <SEO title="Validation Projets - Admin" />
      <AdminLayout title="Validation Projets">
        <div className="space-y-6">
          {/* Projets en attente de validation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Projets en attente ({pendingProjects.length})
              </CardTitle>
              <CardDescription>
                Les projets créés par les utilisateurs en attente de validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingProjects.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun projet en attente de validation
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Ville</TableHead>
                        <TableHead>Date création</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>{project.city}</TableCell>
                          <TableCell>
                            {format(new Date(project.created_at), "dd MMM yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell>{getValidationBadge("pending")}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedProject(project as unknown as ProjectDetails)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Détails
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{project.title}</DialogTitle>
                                  <DialogDescription>
                                    Validez ou rejetez ce projet
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                  <div>
                                    <h3 className="font-semibold">Détails</h3>
                                    <p className="text-sm text-gray-600 mt-2">
                                      <strong>Ville:</strong> {project.city}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      <strong>Statut:</strong> {project.status}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      <strong>Créé le:</strong> {format(new Date(project.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                                    </p>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium">Notes de validation</label>
                                    <textarea
                                      className="w-full p-2 border rounded-md text-sm"
                                      placeholder="Optionnel: ajoutez des notes pour le créateur..."
                                      rows={3}
                                      value={validationNotes}
                                      onChange={(e) => setValidationNotes(e.target.value)}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      className="flex-1 bg-green-600 hover:bg-green-700"
                                      disabled={validatingId === project.id}
                                      onClick={() => handleValidateProject(project.id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Valider
                                    </Button>
                                    <Button
                                      className="flex-1 bg-red-600 hover:bg-red-700"
                                      disabled={validatingId === project.id}
                                      onClick={() => handleRejectProject(project.id)}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Rejeter
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projets créés par l'admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Projets créés par l'admin ({adminProjects.length})
              </CardTitle>
              <CardDescription>
                Les projets créés directement par l'équipe admin
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adminProjects.length === 0 ? (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Aucun projet créé par l'admin
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Ville</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Validation</TableHead>
                        <TableHead>Date création</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>{project.city}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{project.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {getValidationBadge(project.validation_status)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(project.created_at), "dd MMM yyyy", { locale: fr })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}
