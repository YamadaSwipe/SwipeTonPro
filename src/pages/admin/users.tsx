import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, MoreHorizontal, Shield, Ban, CheckCircle, Mail, UserPlus, Edit, Trash2, CheckSquare, Square } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { usePermissions } from "@/hooks/use-permissions";

type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  company_name: string;
  role: "client" | "professional" | "admin" | "super_admin" | "moderator" | "support";
  created_at: string;
  professional?: {
    company_name: string;
    status: string;
    credits_balance: number;
  };
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const permissions = usePermissions();
  
  // États pour les modales
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // États pour la multi-sélection
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Formulaire création utilisateur
  const [newUser, setNewUser] = useState({
    email: "",
    first_name: "",
    last_name: "",
    full_name: "",
    company_name: "",
    role: "client" as "client" | "professional" | "admin" | "super_admin",
    password: "",
  });
  
  // Formulaire modification utilisateur
  const [editUser, setEditUser] = useState({
    first_name: "",
    last_name: "",
    full_name: "",
    company_name: "",
    role: "client" as "client" | "professional" | "admin" | "super_admin",
    status: "pending" as "pending" | "verified" | "suspended" | "rejected",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      
      // Récupérer les profils avec les infos pro jointes
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          first_name,
          last_name,
          full_name,
          company_name,
          role,
          created_at,
          professional:professionals(
            company_name,
            status,
            credits_balance
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transformer les données pour aplatir la structure pro (array -> object)
      const formattedUsers = data.map((user: any) => ({
        ...user,
        professional: user.professional?.[0] || null
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user => 
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.professional?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin": return <Badge className="bg-purple-700 text-white">Super Admin</Badge>;
      case "admin": return <Badge variant="destructive">Admin</Badge>;
      case "support": return <Badge className="bg-cyan-600 text-white">Support</Badge>;
      case "moderator": return <Badge className="bg-amber-600 text-white">Modérateur</Badge>;
      case "team": return <Badge className="bg-indigo-600 text-white">Team</Badge>;
      case "professional": return <Badge variant="default" className="bg-blue-600">Pro</Badge>;
      default: return <Badge variant="secondary">Client</Badge>;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    switch (status) {
      case "verified": return <Badge className="bg-green-600">Vérifié</Badge>;
      case "pending": return <Badge variant="outline" className="text-orange-600 border-orange-600">En attente</Badge>;
      case "rejected": return <Badge variant="destructive">Rejeté</Badge>;
      case "suspended": return <Badge variant="destructive">Suspendu</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Fonctions CRUD
  const handleCreateDialogClose = (open: boolean) => {
    if (!open) {
      // Réinitialiser TOUS les états pour éviter le blocage
      setNewUser({
        email: "",
        first_name: "",
        last_name: "",
        full_name: "",
        company_name: "",
        role: "client",
        password: "",
      });
      setSelectedUsers([]);
      setSelectAll(false);
    }
    setCreateUserDialog(open);
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.email || !newUser.first_name || !newUser.last_name || !newUser.password) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs",
          variant: "destructive",
        });
        return;
      }

      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
        user_metadata: {
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          full_name: `${newUser.first_name} ${newUser.last_name}`,
          role: newUser.role,
        },
      });

      if (authError) throw authError;

      // Créer le profil dans la table profiles
      const fullName = `${newUser.first_name} ${newUser.last_name}`;
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          full_name: fullName,
          company_name: newUser.company_name,
          role: newUser.role,
        });

      if (profileError) throw profileError;

      // Si c'est un professionnel, créer l'entrée dans professionals
      if (newUser.role === "professional") {
        const companyName = newUser.company_name || `${newUser.first_name} ${newUser.last_name}`;
        await supabase
          .from("professionals")
          .insert({
            id: authData.user.id,
            user_id: authData.user.id,
            siret: "TEMP_" + Date.now(),
            company_name: companyName,
            status: "pending",
            credits_balance: 3,
          });
      }

      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès",
      });

      setCreateUserDialog(false);
      setNewUser({
        email: "",
        first_name: "",
        last_name: "",
        full_name: "",
        company_name: "",
        role: "client",
        password: "",
      });
      setSelectedUsers([]);
      setSelectAll(false);
      loadUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async () => {
    try {
      if (!selectedUser) return;

      console.log("🔄 Mise à jour utilisateur:", selectedUser.id, editUser);

      // Vérifier si l'utilisateur a les droits admin
      const { data: currentUser } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!currentUser?.role || !['admin', 'super_admin'].includes(currentUser.role)) {
        throw new Error('Permissions insuffisantes pour modifier les utilisateurs');
      }

      // Mettre à jour le profil dans la table profiles
      const fullName = `${editUser.first_name} ${editUser.last_name}`;
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: editUser.first_name,
          last_name: editUser.last_name,
          full_name: fullName,
          company_name: editUser.company_name,
          role: editUser.role,
        })
        .eq("id", selectedUser.id);

      if (profileError) {
        console.error("❌ Erreur mise à jour profil:", profileError);
        throw new Error(`Erreur profil: ${profileError.message}`);
      }

      // Mettre à jour le statut professionnel si applicable
      if (selectedUser.professional) {
        const { error: proError } = await supabase
          .from("professionals")
          .update({
            status: editUser.status,
          })
          .eq("user_id", selectedUser.id);

        if (proError) {
          console.error("❌ Erreur mise à jour professionnel:", proError);
          throw new Error(`Erreur professionnel: ${proError.message}`);
        }
      }

      console.log("✅ Utilisateur mis à jour avec succès");
      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès",
      });

      // Réinitialiser TOUS les états pour éviter le blocage
      setEditUserDialog(false);
      setSelectedUser(null);
      setEditUser({
        first_name: "",
        last_name: "",
        full_name: "",
        company_name: "",
        role: "client",
        status: "pending",
      });
      setSelectedUsers([]);
      setSelectAll(false);
      
      // Forcer le rechargement complet
      setTimeout(() => {
        loadUsers();
      }, 100);
    } catch (error: any) {
      console.error("❌ Error updating user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'utilisateur",
        variant: "destructive",
      });
    }
  };

  // Fonctions pour la multi-sélection
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'delete' | 'admin' | 'support' | 'moderator') => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Aucune sélection",
        description: "Veuillez sélectionner au moins un utilisateur",
        variant: "destructive",
      });
      return;
    }

    try {
      let updateData: any = {};
      let successMessage = "";

      switch (action) {
        case 'activate':
          updateData = { status: 'verified' };
          successMessage = `${selectedUsers.length} utilisateur(s) activé(s)`;
          break;
        case 'suspend':
          updateData = { status: 'suspended' };
          successMessage = `${selectedUsers.length} utilisateur(s) suspendu(s)`;
          break;
        case 'delete':
          // Supprimer les profils
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .in('id', selectedUsers);
          
          if (deleteError) throw deleteError;
          
          toast({
            title: "Succès",
            description: `${selectedUsers.length} utilisateur(s) supprimé(s)`,
          });
          setSelectedUsers([]);
          loadUsers();
          return;
        case 'admin':
          updateData = { role: 'admin' };
          successMessage = `${selectedUsers.length} utilisateur(s) promu(s) admin`;
          break;
        case 'support':
          updateData = { role: 'support' };
          successMessage = `${selectedUsers.length} utilisateur(s) promu(s) support`;
          break;
        case 'moderator':
          updateData = { role: 'moderator' };
          successMessage = `${selectedUsers.length} utilisateur(s) promu(s) modérateur`;
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .in('id', selectedUsers);

        if (updateError) throw updateError;

        toast({
          title: "Succès",
          description: successMessage,
        });
      }

      setSelectedUsers([]);
      setSelectAll(false);
      loadUsers();
    } catch (error: any) {
      console.error("Error bulk action:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'effectuer l'action groupée",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Supprimer le profil (cascade supprimera les entrées liées)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès",
      });

      setSelectedUsers([]);
      setSelectAll(false);
      loadUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      // Suspendre l'utilisateur
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ validation_status: 'suspended' })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Utilisateur suspendu avec succès",
      });

      // Rafraîchir la liste
      setSelectedUsers([]);
      setSelectAll(false);
      loadUsers();
    } catch (error: any) {
      console.error("Error suspending user:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de suspendre l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleEditDialogClose = (open: boolean) => {
    if (!open) {
      // Réinitialiser TOUS les états pour éviter le blocage
      setSelectedUser(null);
      setEditUser({
        first_name: "",
        last_name: "",
        full_name: "",
        company_name: "",
        role: "client",
        status: "pending",
      });
      setSelectedUsers([]);
      setSelectAll(false);
    }
    setEditUserDialog(open);
  };

  const openEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setEditUser({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      full_name: user.full_name || "",
      company_name: user.company_name || "",
      role: user.role as any,
      status: user.professional?.status as any || "pending",
    });
    setEditUserDialog(true);
  };

  return (
    <>
      <SEO title="Gestion Utilisateurs - Admin" />
      <AdminLayout title="Utilisateurs">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedUsers.length} sélectionné(s)
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Actions groupées
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {permissions.canPromoteToAdmin && (
                      <DropdownMenuItem onClick={() => handleBulkAction('admin')}>
                        <Shield className="h-4 w-4 mr-2" />
                        Promouvoir Admin
                      </DropdownMenuItem>
                    )}
                    {permissions.canPromoteToSupport && (
                      <DropdownMenuItem onClick={() => handleBulkAction('support')}>
                        <Mail className="h-4 w-4 mr-2" />
                        Promouvoir Support
                      </DropdownMenuItem>
                    )}
                    {permissions.canPromoteToModerator && (
                      <DropdownMenuItem onClick={() => handleBulkAction('moderator')}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Promouvoir Modérateur
                      </DropdownMenuItem>
                    )}
                    {permissions.canEditUsers && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkAction('suspend')}>
                          <Ban className="h-4 w-4 mr-2" />
                          Suspendre
                        </DropdownMenuItem>
                      </>
                    )}
                    {permissions.canDeleteUsers && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""}
            </div>
            {permissions.canCreateUsers && (
              <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Créer un utilisateur
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                  <DialogDescription>
                    Créez un nouveau compte utilisateur avec son rôle et ses permissions.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemple.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      placeholder="Jean"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      placeholder="Dupont"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company_name">Entreprise</Label>
                    <Input
                      id="company_name"
                      placeholder="Nom de l'entreprise (optionnel)"
                      value={newUser.company_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, company_name: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value: any) => setNewUser(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="professional">Professionnel</SelectItem>
                        <SelectItem value="moderator">Modérateur</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateUserDialog(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateUser}>
                    Créer l'utilisateur
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-8 w-8 p-0"
                  >
                    {selectAll ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut Pro</TableHead>
                <TableHead>Crédits</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">Chargement...</TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">Aucun utilisateur trouvé</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectUser(user.id)}
                        className="h-8 w-8 p-0"
                      >
                        {selectedUsers.includes(user.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{user.first_name || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{user.last_name || "-"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-blue-600 font-semibold">
                        {user.company_name || user.professional?.company_name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.professional?.status)}</TableCell>
                    <TableCell>
                      {user.role === "professional" ? (
                        <span className="font-mono font-bold">{user.professional?.credits_balance || 0}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {user.created_at && format(new Date(user.created_at), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                            Copier ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" /> Contacter
                          </DropdownMenuItem>
                          {user.role === "professional" && (
                            <>
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Vérifier
                              </DropdownMenuItem>
                            </>
                          )}
                          {(permissions as any).canManageUsers && (
                            <DropdownMenuItem onClick={() => handleSuspendUser(user.id)}>
                              <Ban className="mr-2 h-4 w-4 text-red-600" /> Suspendre
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dialog pour modifier un utilisateur */}
        <Dialog open={editUserDialog} onOpenChange={handleEditDialogClose}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
              <DialogDescription>
                Modifiez le rôle et le statut de l'utilisateur.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Utilisateur</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedUser?.first_name && selectedUser?.last_name 
                    ? `${selectedUser.first_name} ${selectedUser.last_name}` 
                    : selectedUser?.full_name || "Sans nom"} ({selectedUser?.email})
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_first_name">Prénom</Label>
                <Input
                  id="edit_first_name"
                  value={editUser.first_name}
                  onChange={(e) => setEditUser(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Prénom"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_last_name">Nom</Label>
                <Input
                  id="edit_last_name"
                  value={editUser.last_name}
                  onChange={(e) => setEditUser(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Nom"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_company_name">Entreprise</Label>
                <Input
                  id="edit_company_name"
                  value={editUser.company_name}
                  onChange={(e) => setEditUser(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_role">Rôle</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(value: any) => setEditUser(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="professional">Professionnel</SelectItem>
                    <SelectItem value="moderator">Modérateur</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedUser?.role === "professional" && (
                <div className="grid gap-2">
                  <Label htmlFor="edit_status">Statut Professionnel</Label>
                  <Select
                    value={editUser.status}
                    onValueChange={(value: any) => setEditUser(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="verified">Vérifié</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                      <SelectItem value="suspended">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleEditDialogClose(false)}>
                Annuler
              </Button>
              <Button onClick={handleUpdateUser}>
                Sauvegarder les modifications
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}