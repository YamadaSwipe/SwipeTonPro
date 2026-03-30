import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type Bid = Database["public"]["Tables"]["bids"]["Row"] & {
  planning_status?: string;
  planning_date?: string;
  planning_time?: string;
};

interface PlanningCardProps {
  project: Project;
  bid?: Bid;
  professionalView?: boolean;
}

export function PlanningCard({ project, bid, professionalView = false }: PlanningCardProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled": return "Planifié";
      case "confirmed": return "Confirmé";
      case "completed": return "Terminé";
      case "cancelled": return "Annulé";
      default: return "En attente";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{project.title}</CardTitle>
          <Badge className={getStatusColor(bid?.planning_status || "pending")}>
            {getStatusLabel(bid?.planning_status || "pending")}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {project.location}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Planning Status */}
        {bid?.planning_status === "scheduled" && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                RDV Planifié : {bid?.planning_date}
              </p>
              <p className="text-sm text-blue-700">
                Heure : {bid?.planning_time}
              </p>
            </div>
          </div>
        )}

        {/* Planning Form */}
        {professionalView && bid?.planning_status === "confirmed" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Heure</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informations supplémentaires..."
                className="w-full p-2 border rounded-md min-h-[80px]"
              />
            </div>
            
            <Button className="w-full">
              Proposer ce planning
            </Button>
          </div>
        )}

        {/* Client View - Confirm/Reject */}
        {!professionalView && bid?.planning_status === "scheduled" && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Refuser
            </Button>
            <Button className="flex-1">
              Confirmer
            </Button>
          </div>
        )}

        {/* Project Status */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-gray-600" />
          <div>
            <p className="font-medium text-gray-900">
              État du projet : {getStatusLabel(project.status)}
            </p>
            <p className="text-sm text-gray-700">
              {professionalView 
                ? "En attente de confirmation du client" 
                : "Vous pouvez gérer l'état du projet depuis votre dashboard"
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
