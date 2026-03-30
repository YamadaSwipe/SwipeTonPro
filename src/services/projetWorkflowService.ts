import { supabase } from '@/integrations/supabase/client';

export interface ProjetDetails {
  id: string;
  titre: string;
  description: string;
  statut: string;
  updated_at: string;
  client_id: string;
  professional_id?: string;
  client: {
    id: string;
    email: string;
    full_name: string;
  };
  professional?: {
    id: string;
    email: string;
    full_name: string;
    company_name: string;
  };
  paiements: Array<{
    id: string;
    statut: string;
    montant: number;
    created_at: string;
    completed_at?: string;
  }>;
  devis: Array<{
    id: string;
    montant: number;
    statut: string;
    created_at: string;
  }>;
}

export class ProjetWorkflowService {
  static readonly STATUTS = {
    DEPOSE: 'Projet déposé',
    QUALIF: 'En qualification TEAM',
    BADGE: 'Badge CRM attribué',
    VALID: 'Validé support',
    LIGNE: 'Projet en ligne',
    CANDID: 'Candidatures reçues',
    MATCH: 'Match effectué',
    PAIEMENT_ATTENTE: 'Paiement en attente',
    PAIEMENT_ECHOUE: 'Paiement échoué',
    PAIEMENT_RETENTE: 'Retentative paiement',
    DEVIS: 'Devis reçu',
    DEVIS_VALIDE: 'Devis validé',
    TRAVAUX: 'Travaux en cours',
    FIN: 'Fin travaux',
    TERMINE: 'Projet terminé'
  };

  private static readonly TRANSITIONS_VALIDES = {
    DEPOSE: ['QUALIF'],
    QUALIF: ['BADGE', 'DEPOSE'],
    BADGE: ['VALID', 'QUALIF'],
    VALID: ['LIGNE', 'BADGE'],
    LIGNE: ['CANDID', 'VALID'],
    CANDID: ['MATCH', 'LIGNE'],
    MATCH: ['PAIEMENT_ATTENTE', 'CANDID'],
    PAIEMENT_ATTENTE: ['PAIEMENT_ECHOUE', 'PAIEMENT_RETENTE', 'MATCH'],
    PAIEMENT_ECHOUE: ['PAIEMENT_RETENTE', 'CANDID'],
    PAIEMENT_RETENTE: ['PAIEMENT_ATTENTE', 'CANDID'],
    DEVIS: ['DEVIS_VALIDE', 'MATCH'],
    DEVIS_VALIDE: ['TRAVAUX', 'DEVIS'],
    TRAVAUX: ['FIN', 'DEVIS_VALIDE'],
    FIN: ['TERMINE', 'TRAVAUX'],
    TERMINE: [] // État final
  };

  /**
   * Mettre à jour le statut d'un projet avec validation
   */
  static async updateStatut(projetId: string, nouveauStatut: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier la transition valide
      const { data: projet } = await (supabase as any)
        .from('projets')
        .select('statut')
        .eq('id', projetId)
        .single();

      if (!projet) {
        return { success: false, error: 'Projet non trouvé' };
      }

      const transitionsAutorisees = this.TRANSITIONS_VALIDES[projet.statut] || [];
      if (!transitionsAutorisees.includes(nouveauStatut)) {
        return { 
          success: false, 
          error: `Transition invalide de ${projet.statut} vers ${nouveauStatut}` 
        };
      }

      // Mettre à jour le statut
      const { error } = await (supabase as any)
        .from('projets')
        .update({ 
          statut: nouveauStatut,
          updated_at: new Date().toISOString()
        })
        .eq('id', projetId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Logger la transition pour audit
      await this.loggerTransition(projetId, projet.statut, nouveauStatut);

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erreur lors de la mise à jour du statut' };
    }
  }

  /**
   * Récupérer les détails complets d'un projet
   */
  static async getProjetDetails(projetId: string): Promise<ProjetDetails | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('projets')
        .select(`
          *,
          client:profiles!client_id(id, email, full_name),
          professional:profiles!professional_id(id, email, full_name, professionals(company_name)),
          paiements:paiements_mise_en_relation(id, statut, montant, created_at, completed_at),
          devis(*)
        `)
        .eq('id', projetId)
        .single();

      if (error) {
        console.error('Erreur récupération projet:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Erreur getProjetDetails:', err);
      return null;
    }
  }

  /**
   * Récupérer tous les projets d'un utilisateur
   */
  static async getUserProjets(userId: string): Promise<ProjetDetails[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('projets')
        .select(`
          *,
          client:profiles!client_id(id, email, full_name),
          professional:profiles!professional_id(id, email, full_name, professionals(company_name)),
          paiements:paiements_mise_en_relation(id, statut, montant, created_at, completed_at),
          devis(*)
        `)
        .or(`client_id.eq.${userId},professional_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération projets utilisateur:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Erreur getUserProjets:', err);
      return [];
    }
  }

  /**
   * Obtenir les actions disponibles pour un statut
   */
  static getActionsDisponibles(statut: string): Array<{ action: string; label: string; description: string }> {
    const actions: Record<string, Array<{ action: string; label: string; description: string }>> = {
      DEPOSE: [
        { action: 'QUALIF', label: 'Qualifier', description: 'Démarrer la qualification TEAM' }
      ],
      QUALIF: [
        { action: 'BADGE', label: 'Attribuer badge', description: 'Attribuer le badge CRM' },
        { action: 'DEPOSE', label: 'Rejeter', description: 'Rejeter le projet' }
      ],
      BADGE: [
        { action: 'VALID', label: 'Valider', description: 'Valider le projet' },
        { action: 'QUALIF', label: 'Requalifier', description: 'Demander une nouvelle qualification' }
      ],
      VALID: [
        { action: 'LIGNE', label: 'Mettre en ligne', description: 'Publier le projet' }
      ],
      LIGNE: [
        { action: 'CANDID', label: 'Voir candidatures', description: 'Consulter les candidatures reçues' }
      ],
      CANDID: [
        { action: 'MATCH', label: 'Sélectionner', description: 'Sélectionner un professionnel' }
      ],
      MATCH: [
        { action: 'PAIEMENT_ATTENTE', label: 'Paiement', description: 'Initier le paiement de mise en relation' }
      ],
      PAIEMENT_ATTENTE: [
        { action: 'PAIEMENT_ECHOUE', label: 'Paiement échoué', description: 'Marquer le paiement comme échoué' },
        { action: 'PAIEMENT_RETENTE', label: 'Retenter', description: 'Permettre une nouvelle tentative' }
      ],
      DEVIS: [
        { action: 'DEVIS_VALIDE', label: 'Valider devis', description: 'Valider le devis reçu' }
      ],
      DEVIS_VALIDE: [
        { action: 'TRAVAUX', label: 'Démarrer travaux', description: 'Démarrer les travaux' }
      ],
      TRAVAUX: [
        { action: 'FIN', label: 'Fin travaux', description: 'Déclarer la fin des travaux' }
      ],
      FIN: [
        { action: 'TERMINE', label: 'Terminer', description: 'Terminer le projet' }
      ]
    };

    return actions[statut] || [];
  }

  /**
   * Obtenir la couleur du statut pour l'UI
   */
  static getStatutColor(statut: string): string {
    const colors: Record<string, string> = {
      DEPOSE: 'bg-gray-100 text-gray-800',
      QUALIF: 'bg-yellow-100 text-yellow-800',
      BADGE: 'bg-blue-100 text-blue-800',
      VALID: 'bg-indigo-100 text-indigo-800',
      LIGNE: 'bg-green-100 text-green-800',
      CANDID: 'bg-purple-100 text-purple-800',
      MATCH: 'bg-pink-100 text-pink-800',
      PAIEMENT_ATTENTE: 'bg-orange-100 text-orange-800',
      PAIEMENT_ECHOUE: 'bg-red-100 text-red-800',
      PAIEMENT_RETENTE: 'bg-yellow-100 text-yellow-800',
      DEVIS: 'bg-cyan-100 text-cyan-800',
      DEVIS_VALIDE: 'bg-teal-100 text-teal-800',
      TRAVAUX: 'bg-blue-100 text-blue-800',
      FIN: 'bg-indigo-100 text-indigo-800',
      TERMINE: 'bg-green-100 text-green-800'
    };

    return colors[statut] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Logger les transitions pour audit
   */
  private static async loggerTransition(projetId: string, ancienStatut: string, nouveauStatut: string): Promise<void> {
    try {
      const { data: { user } } = await (supabase as any).auth.getUser();
      
      await (supabase as any)
        .from('projet_statut_historique')
        .insert({
          projet_id: projetId,
          ancien_statut: ancienStatut,
          nouveau_statut: nouveauStatut,
          user_id: user?.id,
          timestamp: new Date().toISOString()
        });
    } catch (err) {
      console.error('Erreur logging transition:', err);
      // Ne pas bloquer le processus si le logging échoue
    }
  }

  /**
   * Obtenir l'historique des statuts d'un projet
   */
  static async getHistoriqueStatuts(projetId: string): Promise<Array<{
    ancien_statut: string;
    nouveau_statut: string;
    user_id: string;
    timestamp: string;
    user: { full_name: string };
  }>> {
    try {
      const { data, error } = await (supabase as any)
        .from('projet_statut_historique')
        .select(`
          *,
          user:profiles!user_id(full_name)
        `)
        .eq('projet_id', projetId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Erreur récupération historique:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Erreur getHistoriqueStatuts:', err);
      return [];
    }
  }

  /**
   * Calculer les statistiques des projets
   */
  static async getStatistiquesProjets(): Promise<{
    total: number;
    par_statut: Record<string, number>;
    en_cours: number;
    termines: number;
  }> {
    try {
      const { data, error } = await (supabase as any)
        .from('projets')
        .select('statut');

      if (error) {
        console.error('Erreur statistiques projets:', error);
        return { total: 0, par_statut: {}, en_cours: 0, termines: 0 };
      }

      const projets = data || [];
      const par_statut: Record<string, number> = {};
      
      projets.forEach(projet => {
        par_statut[projet.statut] = (par_statut[projet.statut] || 0) + 1;
      });

      const statutsEnCours = ['LIGNE', 'CANDID', 'MATCH', 'PAIEMENT_ATTENTE', 'PAIEMENT_RETENTE', 'DEVIS', 'DEVIS_VALIDE', 'TRAVAUX', 'FIN'];
      const en_cours = projets.filter(p => statutsEnCours.includes(p.statut)).length;
      const termines = projets.filter(p => p.statut === 'TERMINE').length;

      return {
        total: projets.length,
        par_statut,
        en_cours,
        termines
      };
    } catch (err) {
      console.error('Erreur getStatistiquesProjets:', err);
      return { total: 0, par_statut: {}, en_cours: 0, termines: 0 };
    }
  }
}
