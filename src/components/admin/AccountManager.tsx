/**
 * Composant de gestion des comptes pour l'admin
 * Recherche, réinitialisation et création de comptes
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  UserPlus,
  Key,
  Mail,
  Users,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface Account {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  phone?: string;
}

interface SearchResult {
  profiles: Account[];
  professionals: any[];
}

export default function AccountManager() {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newAccount, setNewAccount] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'professional'
  });

  // Rechercher des comptes
  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setMessage({ type: 'error', text: 'Veuillez entrer un email' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/manage-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-ghost': 'true'
        },
        body: JSON.stringify({
          action: 'search',
          email: searchEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data);
        setMessage({ 
          type: 'success', 
          text: `${data.data.profiles.length + data.data.professionals.length} compte(s) trouvé(s)` 
        });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de recherche' });
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le mot de passe
  const handleResetPassword = async (email: string) => {
    const newPassword = 'TempPassword123!';
    
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/manage-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-ghost': 'true'
        },
        body: JSON.stringify({
          action: 'reset',
          email: email,
          password: newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Mot de passe réinitialisé pour ${email}: ${newPassword}` 
        });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de réinitialisation' });
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau compte
  const handleCreateAccount = async () => {
    if (!newAccount.email || !newAccount.password || !newAccount.fullName) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/manage-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-ghost': 'true'
        },
        body: JSON.stringify({
          action: 'create',
          ...newAccount
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Compte créé: ${data.credentials.email} / ${data.credentials.password}` 
        });
        setNewAccount({ email: '', password: '', fullName: '', role: 'professional' });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de création' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'super_admin': 'destructive',
      'admin': 'destructive',
      'professional': 'default',
      'user': 'secondary'
    };
    return variants[role] || 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <Alert className={message.type === 'success' ? 'border-green-500' : 'border-red-500'}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Recherche de comptes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Rechercher des comptes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search">Email à rechercher</Label>
              <Input
                id="search"
                type="email"
                placeholder="sotbirida@yahoo.fr ou sotbirida@gmail.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </div>

          {/* Résultats de recherche */}
          {searchResults && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Résultats ({searchResults.profiles.length + searchResults.professionals.length})
              </h3>
              
              {searchResults.profiles.map((profile) => (
                <div key={profile.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="font-medium">{profile.email}</span>
                        <Badge variant={getRoleBadge(profile.role)}>
                          {profile.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>{profile.full_name}</span>
                        {profile.phone && <span> • {profile.phone}</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        Créé le {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetPassword(profile.email)}
                      disabled={loading}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Création de compte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Créer un nouveau compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="newEmail">Email</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="nouveau@email.com"
                value={newAccount.email}
                onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="newPassword">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  value={newAccount.password}
                  onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              placeholder="Nom complet de l'utilisateur"
              value={newAccount.fullName}
              onChange={(e) => setNewAccount({...newAccount, fullName: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="role">Rôle</Label>
            <select
              id="role"
              className="w-full p-2 border rounded-md"
              value={newAccount.role}
              onChange={(e) => setNewAccount({...newAccount, role: e.target.value})}
            >
              <option value="professional">Professionnel</option>
              <option value="user">Particulier</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <Button onClick={handleCreateAccount} disabled={loading} className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Créer le compte
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
