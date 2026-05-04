import { supabase } from '@/integrations/supabase/client';

interface ProfessionalProfile {
  id: string;
  profile_id: string;
  company_name: string;
  siret: string;
  vat_number?: string;
  insurance_number?: string;
  insurance_valid_until?: string;
  decennial_insurance?: boolean;
  trades: string[];
  service_areas: string[];
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

interface VerificationStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

interface DocumentUpload {
  id: string;
  professional_id: string;
  document_type: 'kbis' | 'insurance' | 'identity' | 'certification' | 'other';
  file_url: string;
  file_name: string;
  is_verified: boolean;
  uploaded_at: string;
}

// Cache
let verificationCache: { data: ProfessionalProfile[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const proVerificationService = {
  /**
   * Récupère tous les pros avec filtres
   */
  async getProfessionals(filters?: {
    status?: 'pending' | 'verified' | 'rejected' | 'all';
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ professionals: ProfessionalProfile[]; total: number }> {
    try {
      const { status = 'all', search, limit = 50, offset = 0 } = filters || {};

      let query = supabase
        .from('pro_profiles')
        .select('*', { count: 'exact' });

      // Filtre par statut
      if (status !== 'all') {
        query = query.eq('verification_status', status);
      }

      // Recherche texte
      if (search) {
        query = query.or(`company_name.ilike.%${search}%,siret.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Erreur récupération pros:', error);
        return { professionals: [], total: 0 };
      }

      return {
        professionals: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('❌ Erreur service getProfessionals:', error);
      return { professionals: [], total: 0 };
    }
  },

  /**
   * Récupère les statistiques de vérification
   */
  async getVerificationStats(): Promise<VerificationStats> {
    try {
      const { data, error } = await supabase
        .from('pro_profiles')
        .select('verification_status');

      if (error) {
        console.error('❌ Erreur stats vérification:', error);
        return { total: 0, pending: 0, verified: 0, rejected: 0 };
      }

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(p => p.verification_status === 'pending').length || 0,
        verified: data?.filter(p => p.verification_status === 'verified').length || 0,
        rejected: data?.filter(p => p.verification_status === 'rejected').length || 0
      };

      return stats;
    } catch (error) {
      console.error('❌ Erreur service getVerificationStats:', error);
      return { total: 0, pending: 0, verified: 0, rejected: 0 };
    }
  },

  /**
   * Récupère un pro par ID
   */
  async getProfessionalById(id: string): Promise<ProfessionalProfile | null> {
    try {
      const { data, error } = await supabase
        .from('pro_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Erreur récupération pro:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur service getProfessionalById:', error);
      return null;
    }
  },

  /**
   * Met à jour le statut de vérification
   */
  async updateVerificationStatus(
    proId: string,
    status: 'verified' | 'rejected',
    notes: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('pro_profiles')
        .update({
          verification_status: status,
          verification_notes: notes,
          verified_at: new Date().toISOString(),
          verified_by: adminId,
          updated_at: new Date().toISOString()
        })
        .eq('id', proId);

      if (error) {
        console.error('❌ Erreur mise à jour vérification:', error);
        return { success: false, error: 'Erreur lors de la mise à jour' };
      }

      // Mettre à jour le statut dans profiles
      await supabase
        .from('profiles')
        .update({
          is_verified: status === 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', proId);

      // Logger l'action
      await this.logVerificationAction(proId, status, notes, adminId);

      // Envoyer notification au pro
      await this.sendVerificationNotification(proId, status, notes);

      // Invalider le cache
      verificationCache = null;

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur service updateVerificationStatus:', error);
      return { success: false, error: 'Erreur serveur' };
    }
  },

  /**
   * Récupère les documents d'un pro
   */
  async getProfessionalDocuments(proId: string): Promise<DocumentUpload[]> {
    try {
      // Récupérer depuis pro_verification_documents ou documents
      const { data, error } = await supabase
        .from('pro_verification_documents')
        .select('*')
        .eq('professional_id', proId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        // Essayer avec la table documents
        const { data: docsData, error: docsError } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', proId)
          .order('created_at', { ascending: false });

        if (docsError) {
          console.error('❌ Erreur récupération documents:', error);
          return [];
        }

        // Mapper vers le format attendu
        return (docsData || []).map(d => ({
          id: d.id,
          professional_id: d.user_id,
          document_type: d.type || 'other',
          file_url: d.url,
          file_name: d.name || 'document',
          is_verified: d.is_verified || false,
          uploaded_at: d.created_at
        }));
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur service getProfessionalDocuments:', error);
      return [];
    }
  },

  /**
   * Vérifie un document spécifique
   */
  async verifyDocument(
    documentId: string,
    isVerified: boolean,
    notes?: string,
    adminId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('pro_verification_documents')
        .update({
          is_verified: isVerified,
          verified_at: new Date().toISOString(),
          verified_by: adminId,
          verification_notes: notes
        })
        .eq('id', documentId);

      if (error) {
        console.error('❌ Erreur vérification document:', error);
        return { success: false, error: 'Erreur lors de la vérification' };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur service verifyDocument:', error);
      return { success: false, error: 'Erreur serveur' };
    }
  },

  /**
   * Recherche de pros (SIRET, nom, etc.)
   */
  async searchProfessionals(query: string): Promise<ProfessionalProfile[]> {
    try {
      const { data, error } = await supabase
        .from('pro_profiles')
        .select('*')
        .or(`company_name.ilike.%${query}%,siret.ilike.%${query}%,vat_number.ilike.%${query}%`)
        .limit(20);

      if (error) {
        console.error('❌ Erreur recherche pros:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur service searchProfessionals:', error);
      return [];
    }
  },

  /**
   * Export des pros vérifiés
   */
  async exportVerifiedProfessionals(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('pro_profiles')
        .select('*')
        .eq('verification_status', 'verified');

      if (error) {
        console.error('❌ Erreur export pros:', error);
        return '';
      }

      // Générer CSV
      const headers = ['ID', 'Entreprise', 'SIRET', 'TVA', 'Métiers', 'Zones', 'Vérifié le'];
      const rows = (data || []).map(p => [
        p.id,
        p.company_name,
        p.siret,
        p.vat_number || '',
        (p.trades || []).join(', '),
        (p.service_areas || []).join(', '),
        p.verified_at || ''
      ]);

      return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    } catch (error) {
      console.error('❌ Erreur service exportVerifiedProfessionals:', error);
      return '';
    }
  },

  /**
   * Envoie une notification au pro
   */
  private async sendVerificationNotification(
    proId: string,
    status: 'verified' | 'rejected',
    notes?: string
  ): Promise<void> {
    try {
      const title = status === 'verified'
        ? '✅ Vérification approuvée'
        : '❌ Vérification refusée';

      const message = status === 'verified'
        ? 'Votre profil professionnel a été vérifié et approuvé. Vous pouvez maintenant répondre aux projets.'
        : `Votre profil professionnel n'a pas été vérifié. ${notes ? `Motif : ${notes}` : ''}`;

      await supabase.from('notifications').insert({
        user_id: proId,
        title,
        message,
        type: 'verification',
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
    }
  },

  /**
   * Logger l'action de vérification
   */
  private async logVerificationAction(
    proId: string,
    status: string,
    notes: string,
    adminId: string
  ): Promise<void> {
    console.log('📝 VERIFICATION ACTION:', {
      proId,
      status,
      notes,
      adminId,
      timestamp: new Date().toISOString()
    });

    // Insérer dans une table d'audit si nécessaire
    try {
      await supabase.from('admin_audit_logs').insert({
        action: 'professional_verification',
        entity_type: 'pro_profile',
        entity_id: proId,
        admin_id: adminId,
        details: { status, notes },
        created_at: new Date().toISOString()
      });
    } catch (e) {
      // Table peut ne pas exister
    }
  }
};

export type { ProfessionalProfile, VerificationStats, DocumentUpload };
