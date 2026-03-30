import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { TarifService, Tarif } from '@/services/tarifService';

const AdminTarifsPage: React.FC = () => {
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTarif, setEditingTarif] = useState<Tarif | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Tarif>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTarifs();
  }, []);

  const loadTarifs = async () => {
    try {
      setLoading(true);
      const data = await TarifService.getAllTarifs();
      setTarifs(data);
    } catch (error) {
      console.error('Erreur chargement tarifs:', error);
      setError('Impossible de charger les tarifs');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tarif: Tarif) => {
    setEditingTarif(tarif);
    setFormData(tarif);
    setIsCreating(false);
    setError(null);
    setSuccess(null);
  };

  const handleCreate = () => {
    setEditingTarif(null);
    setFormData({
      min_estimation: 0,
      max_estimation: 0,
      frais: 0,
      description: '',
      actif: true
    });
    setIsCreating(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setEditingTarif(null);
    setFormData({});
    setIsCreating(false);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      // Validation
      if (!formData.min_estimation || !formData.max_estimation || formData.frais === undefined) {
        setError('Tous les champs sont obligatoires');
        return;
      }

      if (formData.min_estimation >= formData.max_estimation) {
        setError('L\'estimation minimale doit être inférieure à l\'estimation maximale');
        return;
      }

      if (formData.frais < 0) {
        setError('Les frais ne peuvent pas être négatifs');
        return;
      }

      // Vérifier les chevauchements
      const overlappingTarif = tarifs.find(t => 
        t.id !== editingTarif?.id &&
        (
          (formData.min_estimation! >= t.min_estimation && formData.min_estimation! < t.max_estimation) ||
          (formData.max_estimation! > t.min_estimation && formData.max_estimation! <= t.max_estimation) ||
          (formData.min_estimation! <= t.min_estimation && formData.max_estimation! >= t.max_estimation)
        )
      );

      if (overlappingTarif) {
        setError('Cette plage d\'estimation chevauche un tarif existant');
        return;
      }

      const tarifData = {
        min_estimation: formData.min_estimation!,
        max_estimation: formData.max_estimation!,
        frais: formData.frais!,
        description: formData.description || '',
        actif: formData.actif !== false
      };

      if (isCreating) {
        await TarifService.saveTarif(tarifData);
        setSuccess('Tarif créé avec succès');
      } else if (editingTarif) {
        await TarifService.saveTarif(tarifData, editingTarif.id);
        setSuccess('Tarif mis à jour avec succès');
      }

      await loadTarifs();
      handleCancel();
    } catch (error) {
      console.error('Erreur sauvegarde tarif:', error);
      setError('Erreur lors de la sauvegarde du tarif');
    }
  };

  const handleDelete = async (tarif: Tarif) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le tarif "${tarif.description}" ?`)) {
      return;
    }

    try {
      setError(null);
      await TarifService.deleteTarif(tarif.id);
      setSuccess('Tarif supprimé avec succès');
      await loadTarifs();
    } catch (error) {
      console.error('Erreur suppression tarif:', error);
      setError('Erreur lors de la suppression du tarif');
    }
  };

  const handleToggle = async (tarif: Tarif) => {
    try {
      setError(null);
      await TarifService.toggleTarif(tarif.id, !tarif.actif);
      setSuccess(`Tarif ${tarif.actif ? 'désactivé' : 'activé'} avec succès`);
      await loadTarifs();
    } catch (error) {
      console.error('Erreur activation tarif:', error);
      setError('Erreur lors de la modification du statut du tarif');
    }
  };

  const getStatistiques = () => {
    const actifs = tarifs.filter(t => t.actif).length;
    const total = tarifs.length;
    const totalFrais = tarifs.reduce((sum, t) => sum + t.frais, 0);
    const avgFrais = total > 0 ? totalFrais / total : 0;

    return { actifs, total, totalFrais, avgFrais };
  };

  const stats = getStatistiques();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration des tarifs</h1>
          <p className="text-gray-600 mt-2">Gérez les tarifs de mise en relation</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un tarif
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tarifs actifs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.actifs}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total tarifs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total des frais</p>
                <p className="text-2xl font-bold text-gray-900">
                  {TarifService.formatMontant(stats.totalFrais)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Moyenne des frais</p>
                <p className="text-2xl font-bold text-gray-900">
                  {TarifService.formatMontant(stats.avgFrais)}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Formulaire d'édition/création */}
      {(editingTarif || isCreating) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {isCreating ? 'Créer un nouveau tarif' : 'Modifier le tarif'}
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_estimation">Estimation minimale (€)</Label>
                <Input
                  id="min_estimation"
                  type="number"
                  value={formData.min_estimation || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_estimation: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="max_estimation">Estimation maximale (€)</Label>
                <Input
                  id="max_estimation"
                  type="number"
                  value={formData.max_estimation || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_estimation: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frais">Frais (€)</Label>
                <Input
                  id="frais"
                  type="number"
                  value={formData.frais || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, frais: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ex: Petits travaux"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif !== false}
                onChange={(e) => setFormData(prev => ({ ...prev, actif: e.target.checked }))}
              />
              <Label htmlFor="actif">Tarif actif</Label>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? 'Créer' : 'Sauvegarder'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau des tarifs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des tarifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Plage d'estimation</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Frais</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Statut</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tarifs.map((tarif) => (
                  <tr key={tarif.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {TarifService.formatEstimation(tarif.min_estimation, tarif.max_estimation)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-blue-600">
                        {tarif.frais === 0 ? 'Gratuit' : TarifService.formatMontant(tarif.frais)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-600">{tarif.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={tarif.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {tarif.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tarif)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(tarif)}
                        >
                          {tarif.actif ? 'Désactiver' : 'Activer'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tarif)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTarifsPage;
