import { SEO } from '@/components/SEO';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Plus, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';

type UserRole =
  | 'super_admin'
  | 'admin'
  | 'support'
  | 'moderator'
  | 'team'
  | 'professional'
  | 'client';

interface CreateUserForm {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone: string;
  company_name: string;
}

interface CreateProjectForm {
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  postal_code: string; // TypeScript fix: work_types changed to work_type for consistency
  work_type: string[];
  budget_min: string;
  budget_max: string;
  urgency: string;
  property_type: string;
}

const USER_ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'client',
    label: 'Client',
    description: 'Particulier cherchant des services',
  },
  {
    value: 'professional',
    label: 'Professionnel',
    description: 'Artisan/Pro cherchant des chantiers',
  },
  {
    value: 'support',
    label: 'Support',
    description: 'Agent support de la plateforme',
  },
  {
    value: 'moderator',
    label: 'Modérateur',
    description: 'Modérateur de contenu',
  },
  { value: 'team', label: 'Team', description: "Membre de l'équipe" },
  { value: 'admin', label: 'Admin', description: 'Administrateur plateforme' },
  {
    value: 'super_admin',
    label: 'Super Admin',
    description: 'Super administrateur',
  },
];

import { WORK_TYPES } from '@/lib/constants/work-types';

export default function AdminManageUsers() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('create-users');

  // Auth guard - redirect to login if not admin
  useEffect(() => {
    (async () => {
      const session = await authService.getCurrentSession();
      if (!session) {
        router.replace('/auth/login');
        return;
      }

      // check role from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const allowed = ['admin', 'super_admin', 'support', 'moderator', 'team'];
      if (!profile || !allowed.includes(profile.role)) {
        router.replace('/auth/login');
      }
    })();
  }, [router]);

  // État pour création d'utilisateurs
  const [userForm, setUserForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    full_name: '',
    role: 'client',
    phone: '',
    company_name: '',
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [userCreationResult, setUserCreationResult] = useState<any>(null);

  // État pour création de projets
  const [projectForm, setProjectForm] = useState<CreateProjectForm>({
    title: '',
    description: '',
    category: '',
    location: '',
    city: '',
    postal_code: '',
    work_type: [], // Fixed: work_types -> work_type
    budget_min: '',
    budget_max: '',
    urgency: 'medium',
    property_type: '',
  });
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectCreationResult, setProjectCreationResult] = useState<any>(null);

  // Créer un utilisateur
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setUserCreationResult(null);

    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: userForm.email,
          password: userForm.password,
          full_name: userForm.full_name,
          role: userForm.role,
          phone: userForm.phone || undefined,
          company_name:
            userForm.role === 'professional'
              ? userForm.company_name
              : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setUserCreationResult(data);
      toast({
        title: 'Succès',
        description: `Utilisateur ${userForm.email} créé avec le rôle ${userForm.role}`,
      });

      // Réinitialiser le formulaire
      setUserForm({
        email: '',
        password: '',
        full_name: '',
        role: 'client',
        phone: '',
        company_name: '',
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la création';
      setUserCreationResult({ error: errorMessage });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  // Créer un projet
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingProject(true);
    setProjectCreationResult(null);

    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/admin/manage-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: projectForm.title,
          description: projectForm.description,
          category: projectForm.category,
          location: projectForm.location,
          city: projectForm.city,
          postal_code: projectForm.postal_code,
          work_type: projectForm.work_type,
          budget_min: projectForm.budget_min
            ? parseInt(projectForm.budget_min)
            : null,
          budget_max: projectForm.budget_max
            ? parseInt(projectForm.budget_max)
            : null,
          urgency: projectForm.urgency,
          property_type: projectForm.property_type || null,
          validate_immediately: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setProjectCreationResult(data);
      toast({
        title: 'Succès',
        description: `Projet "${projectForm.title}" créé et validé`,
      });

      // Réinitialiser le formulaire
      setProjectForm({
        title: '',
        description: '',
        category: '',
        location: '',
        city: '',
        postal_code: '',
        work_type: [],
        budget_min: '',
        budget_max: '',
        urgency: 'medium',
        property_type: '',
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la création';
      setProjectCreationResult({ error: errorMessage });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <>
      <SEO
        title="Gestion Admin - SwipeTonPro"
        description="Gérer utilisateurs et projets"
      />
      <AdminLayout title="Gestion Utilisateurs & Projets">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create-users">Créer Utilisateurs</TabsTrigger>
            <TabsTrigger value="create-projects">Créer Projets</TabsTrigger>
          </TabsList>

          {/* Tab: Créer Utilisateurs */}
          <TabsContent value="create-users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Créer un nouvel utilisateur</CardTitle>
                <CardDescription>
                  Créez des utilisateurs avec différents rôles: clients,
                  professionnels, support, modérateurs, etc.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  {/* Rôle */}
                  <div>
                    <label className="text-sm font-medium">
                      Rôle de l'utilisateur
                    </label>
                    <Select
                      value={userForm.role}
                      onValueChange={(value) =>
                        setUserForm({ ...userForm, role: value as UserRole })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label} - {role.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Informations de base */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={userForm.email}
                        onChange={(e) =>
                          setUserForm({ ...userForm, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Mot de passe *
                      </label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={userForm.password}
                        onChange={(e) =>
                          setUserForm({ ...userForm, password: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Nom complet *
                      </label>
                      <Input
                        placeholder="Jean Dupont"
                        value={userForm.full_name}
                        onChange={(e) =>
                          setUserForm({
                            ...userForm,
                            full_name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Téléphone</label>
                      <Input
                        type="tel"
                        placeholder="06 XX XX XX XX"
                        value={userForm.phone}
                        onChange={(e) =>
                          setUserForm({ ...userForm, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Champ entreprise si pro */}
                  {userForm.role === 'professional' && (
                    <div>
                      <label className="text-sm font-medium">
                        Nom de l'entreprise
                      </label>
                      <Input
                        placeholder="SARL ABC Services"
                        value={userForm.company_name}
                        onChange={(e) =>
                          setUserForm({
                            ...userForm,
                            company_name: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={creatingUser}
                    className="w-full"
                  >
                    {creatingUser ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Créer l'utilisateur
                      </>
                    )}
                  </Button>
                </form>

                {/* Résultat */}
                {userCreationResult && (
                  <Alert
                    className={`mt-4 ${userCreationResult.error ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}
                  >
                    {userCreationResult.error ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {userCreationResult.error}
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>Succès!</strong> Utilisateur{' '}
                          {userCreationResult.email} créé avec le rôle{' '}
                          {userCreationResult.role}
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Créer Projets */}
          <TabsContent value="create-projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Créer un projet</CardTitle>
                <CardDescription>
                  Créez des projets directement en tant qu'admin. Ils seront
                  automatiquement validés.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Titre du projet *
                    </label>
                    <Input
                      placeholder="Rénovation salle de bain"
                      value={projectForm.title}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          title: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description *</label>
                    <textarea
                      className="w-full p-2 border rounded-md"
                      placeholder="Description détaillée du projet..."
                      rows={4}
                      value={projectForm.description}
                      onChange={(e) =>
                        setProjectForm({
                          ...projectForm,
                          description: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Catégorie *</label>
                      <Input
                        placeholder="Rénovation"
                        value={projectForm.category}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            category: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Type de bien
                      </label>
                      <Input
                        placeholder="Maison"
                        value={projectForm.property_type}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            property_type: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Adresse *</label>
                      <Input
                        placeholder="123 Rue de la Paix"
                        value={projectForm.location}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            location: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Code postal *
                      </label>
                      <Input
                        placeholder="75000"
                        value={projectForm.postal_code}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            postal_code: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Ville *</label>
                      <Input
                        placeholder="Paris"
                        value={projectForm.city}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            city: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Urgence</label>
                      <Select
                        value={projectForm.urgency}
                        onValueChange={(value) =>
                          setProjectForm({ ...projectForm, urgency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Basse</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        Budget min (€)
                      </label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={projectForm.budget_min}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            budget_min: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Budget max (€)
                      </label>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={projectForm.budget_max}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            budget_max: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={creatingProject}
                    className="w-full"
                  >
                    {creatingProject ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Créer le projet
                      </>
                    )}
                  </Button>
                </form>

                {/* Résultat */}
                {projectCreationResult && (
                  <Alert
                    className={`mt-4 ${projectCreationResult.error ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}
                  >
                    {projectCreationResult.error ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {projectCreationResult.error}
                        </AlertDescription>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <strong>Succès!</strong> Projet "
                          {projectCreationResult.project?.title}" créé et validé
                        </AlertDescription>
                      </>
                    )}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </>
  );
}
