import { SEO } from "@/components/SEO";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, MapPin, DollarSign, Filter, Sparkles, Briefcase } from "lucide-react";
import { projectService } from "@/services/projectService";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ProjectCard } from "@/components/professional/ProjectCard";
import type { Database } from "@/integrations/supabase/types";
import Link from "next/link";

type Project = Database["public"]["Tables"]["projects"]["Row"];

interface RecommendedProject extends Project {
  matchScore: number;
  reasons: string[];
}

export default function BrowseProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: "",
    budgetMin: "",
    budgetMax: "",
    category: ""
  });

  const categories = [
    "Plomberie",
    "Électricité",
    "Peinture",
    "Menuiserie",
    "Maçonnerie",
    "Toiture",
    "Chauffage",
    "Climatisation",
    "Isolation",
    "Carrelage",
    "Parquet",
    "Plâtrerie",
    "Autre"
  ];

  useEffect(() => {
    loadProjects();
  }, [filters]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const serviceFilters = {
        ...filters,
        budgetMin: filters.budgetMin ? parseInt(filters.budgetMin) : undefined,
        budgetMax: filters.budgetMax ? parseInt(filters.budgetMax) : undefined,
      };

      const { data, error } = await projectService.getAvailableProjects(serviceFilters);
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInterestSignaled = () => {
    // Refresh list to update state
    loadProjects();
  };

  return (
    <ProtectedRoute allowedRoles={["professional"]}>
      <div className="min-h-screen bg-background pb-20">
        <SEO 
          title="Trouver des Chantiers - SwipeTonPro" 
          description="Parcourez les chantiers disponibles et trouvez de nouveaux clients."
        />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Chantiers Disponibles</h1>
            <p className="text-text-secondary">
              Trouvez des chantiers correspondant à votre expertise
            </p>
          </div>

          <div className="grid gap-6">
            {/* Search & Filters */}
            <div className="bg-card p-4 rounded-lg shadow-sm border space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-4 w-4" />
                  <Input 
                    placeholder="Rechercher un chantier (ex: plomberie paris...)" 
                    className="pl-10"
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtres
                </Button>
              </div>
            </div>

            {/* Projects List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border">
                <Briefcase className="mx-auto h-12 w-12 text-text-secondary mb-4" />
                <h3 className="text-lg font-medium">Aucun chantier trouvé</h3>
                <p className="text-text-secondary">Essayez de modifier vos filtres de recherche.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onBidSubmitted={handleInterestSignaled}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}