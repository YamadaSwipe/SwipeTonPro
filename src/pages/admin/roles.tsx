import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, Users, Crown, Headphones, Eye, CheckCircle } from "lucide-react";
import { updateUserRole, getAllPermissions, getRolePermissions } from "@/services/permissionService";

type UserRole = Database["public"]["Enums"]["user_role"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// Profile contient déjà email, on peut utiliser Profile directement ou un alias
type UserWithRole = Profile;

const ROLE_ICONS: Record<UserRole, any> = {
  client: Users,
  professional: Shield,
  support: Headphones,
  moderator: Eye,
  admin: CheckCircle,
  super_admin: Crown,
};

const ROLE_LABELS: Record<UserRole, string> = {
  client: "Particulier",
  professional: "Professionnel",
  support: "Support",
  moderator: "Modérateur",
  admin: "Administrateur",
  super_admin: "Super Admin",
};

const ROLE_COLORS: Record<UserRole, string> = {
  client: "bg-gray-100 text-gray-700",
  professional: "bg-blue-100 text-blue-700",
  support: "bg-green-100 text-green-700",
  moderator: "bg-yellow-100 text-yellow-700",
  admin: "bg-orange-100 text-orange-700",
  super_admin: "bg-red-100 text-red-700",
};

export default function AdminRolesPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>({} as any);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterRole, users]);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadUsers(), loadPermissions()]);
    setLoading(false);
  }

  async function loadUsers() {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profiles) {
      setUsers(profiles);
    }
  }

  async function loadPermissions() {
    const allPermissions = await getAllPermissions();
    setPermissions(allPermissions);

    // Charger les permissions pour chaque rôle
    const roles: UserRole[] = ["client", "professional", "support", "moderator", "admin", "super_admin"];
    const permissionsMap: Record<UserRole, string[]> = {} as any;

    for (const role of roles) {
      permissionsMap[role] = await getRolePermissions(role);
    }

    setRolePermissions(permissionsMap);
  }

  function filterUsers() {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRole !== "all") {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    setFilteredUsers(filtered);
  }

  async function handleRoleChange(userId: string, newRole: UserRole) {
    const success = await updateUserRole(userId, newRole);

    if (success) {
      toast({
        title: "✅ Rôle modifié",
        description: "Le rôle de l'utilisateur a été mis à jour",
      });
      loadUsers();
    } else {
      toast({
        title: "❌ Erreur",
        description: "Impossible de modifier le rôle",
        variant: "destructive",
      });
    }
  }

  const roleStats = {
    client: users.filter(u => u.role === "client").length,
    professional: users.filter(u => u.role === "professional").length,
    support: users.filter(u => u.role === "support").length,
    moderator: users.filter(u => u.role === "moderator").length,
    admin: users.filter(u => u.role === "admin").length,
    super_admin: users.filter(u => u.role === "super_admin").length,
  };

  return (
    <>
      <SEO 
        title="Gestion des Rôles - Admin SwipeTonPro"
        description="Gérez les rôles et permissions des utilisateurs"
      />
      
      <AdminLayout title="Gestion des Rôles">
        <div className="space-y-6">
          {/* En-tête */}
          <div>
            <h1 className="text-3xl font-bold">Gestion des Rôles</h1>
            <p className="text-muted-foreground">
              Attribuez et gérez les rôles et permissions des utilisateurs
            </p>
          </div>

          {/* Statistiques des rôles */}
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
              const Icon = ROLE_ICONS[role];
              return (
                <Card key={role}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${ROLE_COLORS[role]}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{roleStats[role]}</p>
                        <p className="text-sm text-muted-foreground">{ROLE_LABELS[role]}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
                    placeholder="Rechercher par email ou nom..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterRole} onValueChange={(value) => setFilterRole(value as UserRole | "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des utilisateurs */}
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Gérez les rôles des utilisateurs de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun utilisateur trouvé
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle actuel</TableHead>
                        <TableHead>Nouveau rôle</TableHead>
                        <TableHead>Date d'inscription</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const Icon = ROLE_ICONS[user.role];
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.full_name || "Sans nom"}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge className={ROLE_COLORS[user.role]}>
                                <Icon className="w-3 h-3 mr-1" />
                                {ROLE_LABELS[user.role]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
                                    const RoleIcon = ROLE_ICONS[role];
                                    return (
                                      <SelectItem key={role} value={role}>
                                        <div className="flex items-center gap-2">
                                          <RoleIcon className="w-4 h-4" />
                                          {ROLE_LABELS[role]}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString("fr-FR")}
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

          {/* Tableau des permissions par rôle */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions par Rôle</CardTitle>
              <CardDescription>
                Aperçu des permissions attribuées à chaque rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Permission</TableHead>
                      {(Object.keys(ROLE_LABELS) as UserRole[]).filter(r => r !== "client").map((role) => (
                        <TableHead key={role} className="text-center">
                          {ROLE_LABELS[role]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{permission.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {permission.description}
                            </p>
                          </div>
                        </TableCell>
                        {(Object.keys(ROLE_LABELS) as UserRole[]).filter(r => r !== "client").map((role) => (
                          <TableCell key={role} className="text-center">
                            {role === "super_admin" || rolePermissions[role]?.includes(permission.name) ? (
                              <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}