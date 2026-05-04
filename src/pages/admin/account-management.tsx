/**
 * Page de gestion des comptes pour l'admin
 */

import { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import AccountManager from '@/components/admin/AccountManager';
import { Shield, Users } from 'lucide-react';

export default function AccountManagementPage() {
  return (
    <AdminLayout title="Gestion des Comptes">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Gestion des Comptes Utilisateurs
            </h2>
          </div>
          <p className="text-gray-600">
            Recherchez, réinitialisez et créez des comptes utilisateurs depuis cette interface.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Instructions rapides
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Rechercher:</strong> Entrez un email pour trouver les comptes existants</li>
            <li>• <strong>Réinitialiser:</strong> Le mot de passe temporaire est "TempPassword123!"</li>
            <li>• <strong>Créer:</strong> Remplissez tous les champs pour un nouveau compte</li>
            <li>• <strong>Comptes recherchés:</strong> sotbirida@yahoo.fr, sotbirida@gmail.com</li>
          </ul>
        </div>

        {/* Composant de gestion */}
        <AccountManager />

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Recherche rapide</h4>
            <p className="text-sm text-gray-600">
              Trouvez instantanément n'importe quel compte par email
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Réinitialisation MP</h4>
            <p className="text-sm text-gray-600">
              Générez des mots de passe temporaires sécurisés
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Création de compte</h4>
            <p className="text-sm text-gray-600">
              Créez des comptes professionnels ou particuliers
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
