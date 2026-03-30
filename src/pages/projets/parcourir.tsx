import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Search, MapPin, Euro, Calendar, Award, Loader2, Filter, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { projectService } from '@/services/projectService';
import { WORK_TYPES, FRENCH_CITIES } from "@/lib/constants/work-types";
import type { Database } from "@/integrations/supabase/types";

type Project = Database['public']['Tables']['projects']['Row'] & {
  required_certifications?: string[];
};

export default function ProjectsBrowsePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterBudgetMin, setFilterBudgetMin] = useState("");
  const [filterBudgetMax, setFilterBudgetMax] = useState("");
  const [filterWorkTypes, setFilterWorkTypes] = useState<string[]>([]);
  const [filterDelay, setFilterDelay] = useState("");
  const [filterDistance, setFilterDistance] = useState("");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Load active projects
  useEffect(() => {
    loadProjects();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Géolocalisation non autorisée:", error);
        }
      );
    }
  };

  const loadProjects = async () => {
    console.log("📋 Début chargement projets parcours...");
    setLoading(true);
    try {
      // Get all available published projects
      const { data, error } = await projectService.getAvailableProjects();
      console.log("📋 Projets récupérés pour parcours:", data);
      console.log("📋 Type de données:", typeof data);
      console.log("📋 Est un array?", Array.isArray(data));
      
      if (error) {
        console.error("📋 Erreur lors du chargement des projets:", error);
        return;
      }
      if (data && Array.isArray(data)) {
        console.log("📋 Nombre total de projets:", data.length);
        
        // Filtrer uniquement les projets publiés
        const publishedProjects = data.filter(project => project.status === 'published');
        console.log("📋 Projets publiés filtrés:", publishedProjects);
        console.log("📋 Nombre de projets publiés:", publishedProjects.length);
        
        setProjects(publishedProjects);
        setFilteredProjects(publishedProjects);
      } else {
        console.log("📋 Pas de données ou format invalide");
      }
    } catch (error) {
      console.error("📋 Erreur lors du chargement des projets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects based on search and filters
  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const searchInTitle = p.title?.toLowerCase().includes(query);
        const searchInDescription = p.description?.toLowerCase().includes(query);
        const searchInWorkTypes = p.work_types?.some(wt => wt?.toLowerCase().includes(query));
        return searchInTitle || searchInDescription || searchInWorkTypes;
      });
    }

    // Work types filter
    if (filterWorkTypes.length > 0) {
      filtered = filtered.filter(p => 
        p.work_types?.some(wt => filterWorkTypes.includes(wt))
      );
    }

    // City filter
    if (filterCity) {
      filtered = filtered.filter(p => 
        p.city?.toLowerCase().includes(filterCity.toLowerCase())
      );
    }

    // Budget filter
    if (filterBudgetMin) {
      const min = parseFloat(filterBudgetMin);
      filtered = filtered.filter(p => (p.estimated_budget_max || 0) >= min);
    }
    if (filterBudgetMax) {
      const max = parseFloat(filterBudgetMax);
      filtered = filtered.filter(p => (p.estimated_budget_min || 0) <= max);
    }

    // Delay filter
    if (filterDelay) {
      filtered = filtered.filter(p => {
        // Récupérer la durée depuis ai_analysis si disponible
        try {
          const analysis = typeof p.ai_analysis === 'string' ? JSON.parse(p.ai_analysis) : p.ai_analysis;
          const duration = analysis?.duration_days ? parseInt(analysis.duration_days) : null;
          if (!duration) return true; // Si pas de durée, on ne filtre pas
          switch (filterDelay) {
            case "1": return duration <= 7; // 1 semaine
            case "2": return duration <= 14; // 2 semaines
            case "3": return duration <= 30; // 1 mois
            case "4": return duration <= 60; // 2 mois
            case "5": return duration <= 90; // 3 mois
            default: return true;
          }
        } catch (error) {
          return true; // Si erreur parsing, on ne filtre pas
        }
      });
    }

    // Distance filter (if user location is available)
    if (filterDistance && userLocation) {
      filtered = filtered.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const distance = calculateDistance(
          userLocation.lat, 
          userLocation.lng, 
          p.latitude, 
          p.longitude
        );
        return distance <= parseFloat(filterDistance);
      });
    }

    setFilteredProjects(filtered);
  }, [searchQuery, filterCity, filterBudgetMin, filterBudgetMax, filterWorkTypes, filterDelay, filterDistance, projects, userLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleWorkTypeToggle = (workType: string) => {
    setFilterWorkTypes(prev => 
      prev.includes(workType) 
        ? prev.filter(wt => wt !== workType)
        : [...prev, workType]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterCity("");
    setFilterBudgetMin("");
    setFilterBudgetMax("");
    setFilterWorkTypes([]);
    setFilterDelay("");
    setFilterDistance("");
  };

  return (
    <>
      <SEO 
        title="Parcourir les Projets - SwipeTonPro"
        description="Découvrez les projets de rénovation et travaux BTP disponibles sur SwipeTonPro"
      />

      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface">
        {/* Header */}
        <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Retour</span>
              </Link>
              <div className="font-mono text-sm font-semibold text-primary">Tous les Projets</div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Parcourez les <span className="gradient-primary bg-clip-text text-transparent">Projets Disponibles</span>
            </h1>
            <p className="text-text-secondary">
              {filteredProjects.length} projet{filteredProjects.length !== 1 ? 's' : ''} trouvé{filteredProjects.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filtres de recherche</h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {showAdvancedFilters ? "Moins" : "Plus"} de filtres
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Effacer
                </Button>
              </div>
            </div>
            
            {/* Basic Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Rechercher</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <Input 
                    type="text"
                    placeholder="Titre, type de travaux..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Type de travaux</label>
                <Select value={filterWorkTypes.join(",")} onValueChange={(value) => setFilterWorkTypes(value ? value.split(",") : [])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <Checkbox 
                          checked={filterWorkTypes.length === WORK_TYPES.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterWorkTypes(WORK_TYPES);
                            } else {
                              setFilterWorkTypes([]);
                            }
                          }}
                        />
                        <span className="ml-2 text-sm">Tous les types</span>
                      </div>
                      {WORK_TYPES.map((workType) => (
                        <div key={workType} className="p-2">
                          <Checkbox 
                            checked={filterWorkTypes.includes(workType)}
                            onCheckedChange={() => handleWorkTypeToggle(workType)}
                          />
                          <span className="ml-2 text-sm">{workType}</span>
                        </div>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Ville</label>
                <Select value={filterCity} onValueChange={setFilterCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="max-h-60 overflow-y-auto">
                      {FRENCH_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Budget min €</label>
                <Input 
                  type="number"
                  placeholder="Min"
                  value={filterBudgetMin}
                  onChange={(e) => setFilterBudgetMin(e.target.value)}
                />
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Budget max €</label>
                  <Input 
                    type="number"
                    placeholder="Max"
                    value={filterBudgetMax}
                    onChange={(e) => setFilterBudgetMax(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Délai</label>
                  <Select value={filterDelay} onValueChange={setFilterDelay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">≤ 1 semaine</SelectItem>
                      <SelectItem value="2">≤ 2 semaines</SelectItem>
                      <SelectItem value="3">≤ 1 mois</SelectItem>
                      <SelectItem value="4">≤ 2 mois</SelectItem>
                      <SelectItem value="5">≤ 3 mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Distance (km)</label>
                  <Select value={filterDistance} onValueChange={setFilterDistance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">≤ 5 km</SelectItem>
                      <SelectItem value="10">≤ 10 km</SelectItem>
                      <SelectItem value="20">≤ 20 km</SelectItem>
                      <SelectItem value="50">≤ 50 km</SelectItem>
                      <SelectItem value="100">≤ 100 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            <div className="flex flex-wrap gap-2 mt-4">
              {filterWorkTypes.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  {filterWorkTypes.length} type{filterWorkTypes.length > 1 ? 's' : ''} sélectionné{filterWorkTypes.length > 1 ? 's' : ''}
                </Badge>
              )}
              {filterCity && (
                <Badge variant="secondary">
                  {filterCity}
                </Badge>
              )}
              {filterBudgetMin && (
                <Badge variant="secondary">
                  Budget ≥ {filterBudgetMin}€
                </Badge>
              )}
              {filterBudgetMax && (
                <Badge variant="secondary">
                  Budget ≤ {filterBudgetMax}€
                </Badge>
              )}
              {filterDelay && (
                <Badge variant="secondary">
                  Délai: {filterDelay === "1" ? "≤ 1 semaine" : 
                        filterDelay === "2" ? "≤ 2 semaines" : 
                        filterDelay === "3" ? "≤ 1 mois" : 
                        filterDelay === "4" ? "≤ 2 mois" : "≤ 3 mois"}
                </Badge>
              )}
              {filterDistance && (
                <Badge variant="secondary">
                  ≤ {filterDistance}km
                </Badge>
              )}
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <p className="text-text-secondary text-lg">
                  {projects.length === 0 
                    ? "Aucun projet disponible pour le moment." 
                    : "Aucun projet ne correspond à vos filtres."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card 
                  key={project.id}
                  className="border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 group"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {project.title}
                      </CardTitle>
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2">{project.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Location */}
                    <div className="flex items-center gap-2 text-text-secondary">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{project.city} ({project.postal_code})</span>
                    </div>

                    {/* Budget */}
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Euro className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {(project.estimated_budget_min || project.budget_min || 0).toLocaleString('fr-FR')} - {(project.estimated_budget_max || project.budget_max || 0).toLocaleString('fr-FR')} €
                      </span>
                    </div>

                    {/* Deadline */}
                    {project.desired_deadline && (
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{project.desired_deadline.toString()}</span>
                      </div>
                    )}

                    {/* Work Types */}
                    {project.work_types && project.work_types.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.work_types.map((wt: any, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {wt}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Required Certifications */}
                    {project.required_certifications && project.required_certifications.length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-xs text-text-secondary font-medium mb-2 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Certifications requises
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {project.required_certifications.map((cert, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Estimation */}
                    {project.ai_analysis && (
                      <div className="pt-2 border-t border-border/50 text-xs text-text-secondary">
                        <p className="font-medium">🤖 Analyse IA</p>
                        <div className="space-y-1">
                          {typeof project.ai_analysis === 'object' ? (
                            <>
                              {(project.ai_analysis as any)?.estimated_cost && (
                                <p>Coût estimé: {(project.ai_analysis as any).estimated_cost}€</p>
                              )}
                              {(project.ai_analysis as any)?.duration_days && (
                                <p>Durée: {(project.ai_analysis as any).duration_days} jours</p>
                              )}
                              {(project.ai_analysis as any)?.complexity && (
                                <p>Complexité: {(project.ai_analysis as any).complexity}</p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-blue-600 font-medium">Estimation chiffrée disponible</p>
                              <p className="whitespace-pre-wrap text-xs mt-1">{project.ai_analysis}</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button 
                      className="w-full mt-4"
                      onClick={() => window.location.href = `/professionnel?projectId=${project.id}`}
                    >
                      Voir détails
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
