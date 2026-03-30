import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Star, MapPin, ShieldCheck, Trophy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfessionalCardProps {
  professional: {
    id: string;
    company_name: string;
    rating_average: number;
    rating_count: number;
    city: string;
    description?: string;
    avatar_url?: string;
    certifications?: any;
    is_verified?: boolean;
    specialties?: string[];
  };
  matchScore?: number;
  onContact: (id: string) => void;
  onViewProfile: (id: string) => void;
}

export function ProfessionalCard({ professional, matchScore, onContact, onViewProfile }: ProfessionalCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", matchScore && matchScore > 80 ? "border-primary/50" : "")}>
      <CardHeader className="p-4 flex flex-row gap-4 items-start">
        <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
          <AvatarImage src={professional.avatar_url} />
          <AvatarFallback>{professional.company_name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg truncate flex items-center gap-1">
                {professional.company_name}
                {professional.is_verified && (
                  <ShieldCheck className="h-4 w-4 text-primary" aria-label="Vérifié" />
                )}
              </h3>
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <MapPin className="h-3 w-3" />
                {professional.city || "Non renseigné"}
              </div>
            </div>
            {matchScore && (
              <Badge variant={matchScore > 80 ? "default" : "secondary"} className="ml-2">
                {Math.round(matchScore)}% Match
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm">{professional.rating_average?.toFixed(1) || "N/A"}</span>
            <span className="text-xs text-muted-foreground">({professional.rating_count || 0} avis)</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-1 mb-3">
          {professional.specialties?.slice(0, 3).map((spec, i) => (
            <Badge key={i} variant="outline" className="text-xs font-normal">
              {spec}
            </Badge>
          ))}
          {(professional.specialties?.length || 0) > 3 && (
            <Badge variant="outline" className="text-xs font-normal">
              +{(professional.specialties?.length || 0) - 3}
            </Badge>
          )}
        </div>
        
        {professional.certifications && Object.keys(professional.certifications).length > 0 && (
          <div className="flex gap-2 items-center text-xs text-primary font-medium bg-primary/5 p-2 rounded mb-2">
            <Trophy className="h-3 w-3" />
            Certifié: {Object.keys(professional.certifications).filter(k => k !== 'other').map(k => k.toUpperCase()).join(", ")}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 bg-muted/30 flex gap-2">
        <Button variant="outline" className="flex-1 h-9 text-sm" onClick={() => onViewProfile(professional.id)}>
          Voir profil
        </Button>
        <Button className="flex-1 h-9 text-sm" onClick={() => onContact(professional.id)}>
          Contacter
        </Button>
      </CardFooter>
    </Card>
  );
}