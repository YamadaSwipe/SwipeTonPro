import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Download, Eye, Shield, Users, DollarSign, Settings } from "lucide-react";

type AdminAction = Database["public"]["Tables"]["admin_actions"]["Row"];

interface AdminActionWithProfile extends AdminAction {
  admin_profile?: {
    full_name: string | null;
    email?: string;
  };
  target_user_profile?: {
    full_name: string | null;
    email?: string;
  };
}

const ACTION_ICONS: Record<string, any> = {
  user_role_change: Shield,
  user_suspend: Users,
  user_activate: Users,
  price_change: DollarSign,
  setting_change: Settings,
  credit_adjustment: DollarSign,
};

const ACTION_COLORS: Record<string, string> = {
  user_role_change: "bg-blue-100 text-blue-700",
  user_suspend: "bg-red-100 text-red-700",
  user_activate: "bg-green-100 text-green-700",
  price_change: "bg-orange-100 text-orange-700",
  setting_change: "bg-purple-100 text-purple-700",
  credit_adjustment: "bg-yellow-100 text-yellow-700",
};

export default function AdminActivityLogsPage() {
  const [actions, setActions] = useState<AdminActionWithProfile[]>([]);
  const [filteredActions, setFilteredActions] = useState<AdminActionWithProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActions();
  }, []);

  useEffect(() => {
    filterActions();
  }, [searchQuery, filterType, actions]);

  async function loadActions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("admin_actions")
      .select(`
        *,
        admin_profile:profiles!admin_id(full_name, email),
        target_user_profile:profiles!target_user_id(full_name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error loading actions:", error);
    } else if (data) {
      setActions(data as any);
    }

    setLoading(false);
  }

  function filterActions() {
    let filtered = actions;

    if (searchQuery) {
      filtered = filtered.filter(action =>
        action.admin_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.admin_profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.action_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(action => action.action_type === filterType);
    }

    setFilteredActions(filtered);
  }

  function exportToCSV() {
    const headers = ["Date", "Admin", "Action", "Utilisateur ciblé", "Détails"];
    const rows = filteredActions.map(action => [
      new Date(action.created_at).toLocaleString("fr-FR"),
      action.admin_profile?.full_name || action.admin_profile?.email || "Inconnu",
      action.action_type,
      action.target_user_profile?.full_name || action.target_user_profile?.email || "-",
      JSON.stringify(action.details || {}),
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  const actionTypes = Array.from(new Set(actions.map(a => a.action_type)));

  return (
    <>
      <SEO 
        title="Logs d'Activité - Admin SwipeTonPro"
        description="Historique des actions administratives"
      />
      
      <AdminLayout title="Logs d'Activité">
        <div className="space-y-6">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Logs d'Activité</h1>
              <p className="text-muted-foreground">
                Historique complet des actions administratives
              </p>
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
          </div>

          {/* Statistiques */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{actions.length}</p>
                  <p className="text-sm text-muted-foreground">Actions totales</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {actions.filter(a => a.created_at > new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Dernières 24h</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {new Set(actions.map(a => a.admin_id)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Admins actifs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{actionTypes.length}</p>
                  <p className="text-sm text-muted-foreground">Types d'actions</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par admin ou action..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {actionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des actions */}
          <Card>
            <CardHeader>
              <CardTitle>Historique ({filteredActions.length})</CardTitle>
              <CardDescription>
                100 dernières actions administratives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : filteredActions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune action trouvée
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Utilisateur ciblé</TableHead>
                        <TableHead>Détails</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActions.map((action) => {
                        const Icon = ACTION_ICONS[action.action_type] || Eye;
                        const color = ACTION_COLORS[action.action_type] || "bg-gray-100 text-gray-700";
                        return (
                          <TableRow key={action.id}>
                            <TableCell>
                              {new Date(action.created_at).toLocaleString("fr-FR")}
                            </TableCell>
                            <TableCell className="font-medium">
                              {action.admin_profile?.full_name || action.admin_profile?.email || "Inconnu"}
                            </TableCell>
                            <TableCell>
                              <Badge className={color}>
                                <Icon className="w-3 h-3 mr-1" />
                                {action.action_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {action.target_user_profile?.full_name || action.target_user_profile?.email || "-"}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {JSON.stringify(action.details || {})}
                              </code>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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