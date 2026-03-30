
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Coins, CreditCard, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export function CreditBalance() {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: professional } = await supabase
        .from("professionals")
        .select("credits_balance")
        .eq("user_id", user.id)
        .single();

      if (professional) {
        setCredits(professional.credits_balance || 0);
      }
    } catch (error) {
      console.error("Error loading credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCreditColor = (balance: number) => {
    if (balance >= 10) return "text-green-600";
    if (balance >= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getCreditText = (balance: number) => {
    if (balance >= 10) return "Crédits suffisants";
    if (balance >= 5) return "Crédits moyens";
    return "Crédits faibles";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-sm">
          <Coins className="h-4 w-4 mr-2" />
          Mes Crédits
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-center space-y-3">
          <div className="text-2xl font-bold">
            <span className={getCreditColor(credits)}>
              {credits}
            </span>
            <span className="text-sm text-muted-foreground ml-1">crédits</span>
          </div>
          
          <Badge 
            variant={credits >= 5 ? "default" : "destructive"}
            className="text-xs"
          >
            {getCreditText(credits)}
          </Badge>

          <div className="text-xs text-muted-foreground">
            <p>1 crédit = 1 déblocage de coordonnées</p>
            <p>Coût: 5€ - 15€ selon projet</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Link href="/professionnel/buy-credits">
              <Button size="sm" className="flex-1">
                <Plus className="h-3 w-3 mr-1" />
                Recharger
              </Button>
            </Link>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={loadCredits}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Actualiser
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}