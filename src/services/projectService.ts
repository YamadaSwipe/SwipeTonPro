import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { notificationService } from '@/services/notificationService';
import { authService } from '@/services/authService';
import { supabaseQueue } from '@/utils/supabaseQueue';
import axios from 'axios';
import { getAdminProjectValidationNotificationHtml, getProjectApprovedNotificationHtml, getProjectRejectedNotificationHtml } from '@/lib/projectEmailTemplates';

type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];

// Simplifier les types pour éviter les erreurs d'instanciation
type SimpleProject = {
  id: string;
  title: string;
  status: string;
  validation_status?: string;
  budget_max?: number;
  budget_min?: number;
  estimated_budget_max?: number;
  estimated_budget_min?: number;
  created_at: string;
  category?: string;
  city?: string;
  bids_count?: number;
  ai_analysis?: string;
  ai_estimation?: string;
};

export const projectService = {
  async getUserProjects(): Promise<{ data: SimpleProject[] | null, error: Error | null }> {
    try {
      const session = await authService.getCurrentSession();
      if (!session?.user) return { data: null, error: new Error("User not authenticated") };

      console.log("🔍 Recherche projets pour user_id:", session.user.id);

      const { data, error } = await supabase
        .from('projects')
        .select('id, title, status, budget_max, budget_min, estimated_budget_max, estimated_budget_min, created_at, category, city, bids_count, ai_analysis, validation_status')
        .eq('client_id', session.user.id)
        .order('created_at', { ascending: false });

      console.log("📊 Résultat projets:", { 
        count: data?.length || 0, 
        projects: data?.map((p: any) => ({ id: p.id, title: p.title, status: p.status, validation_status: p.validation_status })) || [],
        error 
      });

      // Debug détaillé si aucun projet trouvé
      if (data && data.length === 0) {
        console.log("🔍 Aucun projet trouvé, vérification user_id:", session.user.id);
        
        // Vérifier s'il y a des projets dans la table
        const { count, error: countError } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });
        
        console.log("📈 Total projets dans la base:", count, countError);
      }

      if (error) {
        console.error("🔍 Erreur Supabase détaillée:", error);
        console.error("🔍 Code erreur:", error.code);
        console.error("🔍 Message erreur:", error.message);
        console.error("🔍 Details erreur:", error.details);
        console.error("🔍 Hint erreur:", error.hint);
      }
      
      return { data, error };
    } catch (error) {
      console.error("🔍 Erreur catch:", error);
      return { data: null, error: error as Error };
    }
  },

  async getAvailableProjects(filters?: any): Promise<{ data: Project[] | null, error: Error | null }> {
    try {
      console.log("🔍 Début getAvailableProjects avec filtres:", filters);
      
      let query = (supabase as any)
        .from('projects')
        .select('*, client:profiles!projects_client_id_fkey(*)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      console.log("🔍 Requête de base construite avec relation explicite");

      if (filters?.workType) {
        query = query.eq('work_type', filters.workType);
        console.log("🔍 Filtre work_type appliqué:", filters.workType);
      }
      if (filters?.city) {
        query = query.eq('city', filters.city);
        console.log("🔍 Filtre city appliqué:", filters.city);
      }
      if (filters?.maxBudget) {
        query = query.lte('budget_max', filters.maxBudget);
        console.log("🔍 Filtre maxBudget appliqué:", filters.maxBudget);
      }

      console.log("🔍 Exécution de la requête...");
      const { data, error } = await query;
      
      console.log("🔍 Résultat requête:", { data, error });
      console.log("🔍 Nombre de projets:", data?.length || 0);
      
      // Debug détaillé des projets récupérés
      if (data && data.length > 0) {
        console.log("🔍 Projets récupérés avec détails:");
        data.forEach((project, index) => {
          console.log(`🔍 Projet ${index + 1}:`, {
            id: project.id,
            title: project.title,
            status: project.status,
            client_id: project.client_id,
            client_email: project.client?.email,
            validation_status: project.validation_status
          });
        });
      }
      
      if (error) {
        console.error("🔍 Erreur Supabase détaillée:", error);
        console.error("🔍 Code erreur:", error.code);
        console.error("🔍 Message erreur:", error.message);
        console.error("🔍 Details erreur:", error.details);
        console.error("🔍 Hint erreur:", error.hint);
      }
      
      return { data, error };
    } catch (error) {
      console.error("🔍 Erreur catch:", error);
      return { data: null, error: error as Error };
    }
  },

  async getProjectsForValidation(): Promise<{ data: any[] | null, error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, 
          title, 
          description, 
          category, 
          city, 
          estimated_budget_min, 
          estimated_budget_max, 
          status, 
          validation_status, 
          is_featured, 
          is_urgent, 
          created_at,
          client_id,
          client:profiles!projects_client_id_fkey(email)
        `)
        .in('status', ['pending', 'published'])
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async updateProjectValidation(projectId: string, validationData: {
    action: 'approve' | 'reject' | 'feature' | 'urgent';
    validated_by?: string;
    notes?: string | null;
  }): Promise<{ data: any | null, error: Error | null }> {
    try {
      const updates: any = {
        updated_at: new Date().toISOString()
      };

      switch (validationData.action) {
        case 'approve':
          updates.validation_status = 'approved';
          updates.validated_at = new Date().toISOString();
          updates.validated_by = validationData.validated_by;
          updates.status = 'published';
          break;
        case 'reject':
          updates.validation_status = 'rejected';
          updates.validated_at = new Date().toISOString();
          updates.validated_by = validationData.validated_by;
          updates.status = 'cancelled';
          break;
        case 'feature':
          updates.is_featured = true;
          updates.featured_at = new Date().toISOString();
          updates.validation_status = 'featured';
          break;
        case 'urgent':
          updates.is_urgent = true;
          updates.urgent_at = new Date().toISOString();
          updates.validation_status = 'urgent';
          break;
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      // Envoyer les notifications
      await this.sendValidationNotifications(projectId, validationData.action, data);

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async sendValidationNotifications(projectId: string, action: string, projectData: any): Promise<void> {
    try {
      const project = projectData;
      
      switch (action) {
        case 'approve':
          // Notifier le client que son projet est approuvé
          await axios.post("/api/send-email", {
            to: project.client_email,
            subject: `Votre projet "${project.title}" a été approuvé !`,
            html: this.getProjectApprovedEmailHtml(project.title, project.id),
            type: 'noreply'
          });
          break;
        case 'reject':
          // Notifier le client que son projet est rejeté
          await axios.post("/api/send-email", {
            to: project.client_email,
            subject: `Votre projet "${project.title}" a été rejeté`,
            html: this.getProjectRejectedEmailHtml(project.title, projectData.notes),
            type: 'noreply'
          });
          break;
        case 'feature':
          // Notifier le client que son projet est en vedette
          await axios.post("/api/send-email", {
            to: project.client_email,
            subject: `Votre projet "${project.title}" est maintenant en vedette !`,
            html: this.getProjectFeaturedEmailHtml(project.title, project.id),
            type: 'noreply'
          });
          break;
        case 'urgent':
          // Notifier le client que son projet est marqué comme urgent
          await axios.post("/api/send-email", {
            to: project.client_email,
            subject: `Votre projet "${project.title}" est maintenant urgent !`,
            html: this.getProjectUrgentEmailHtml(project.title, project.id),
            type: 'noreply'
          });
          break;
      }
    } catch (error) {
      console.error('Erreur envoi notification validation:', error);
    }
  },

  async getProjectById(projectId: string): Promise<{ data: any | null, error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async createProject(projectData: any): Promise<any> {
    try {
      // Récupérer l'utilisateur courant
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Préparer les données du projet
      const projectToInsert = {
        ...projectData,
        client_id: user.id,
        status: projectData.status || 'published',
        validation_status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ai_estimation: `Estimation IA pour ${projectData.title}: Budget ${projectData.estimated_budget_min || projectData.budget_min || 0}€ - ${projectData.estimated_budget_max || projectData.budget_max || 0}€. Catégorie: ${projectData.category}. Localisation: ${projectData.city}.`
      };

      // Insérer le projet
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert([projectToInsert])
        .select()
        .single();

      if (error) throw error;
      
      if (!newProject) {
        throw new Error('Échec de la création du projet');
      }

      // Envoyer une notification aux admins pour validation (uniquement si le projet n'est pas déjà publié)
      if (projectToInsert.status === 'draft' || projectToInsert.validation_status === 'pending') {
        try {
          // Récupérer l'email du client
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', user.id)
            .single();

          const clientEmail = profileData?.email || user.email || '';

          // Construire l'URL du dashboard admin
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          const adminDashboardUrl = `${baseUrl}/admin/projects-validation`;

          // Envoyer une notification au support pour validation
            try {
              await axios.post("/api/send-email", {
                to: "support@swipetonpro.fr",
                subject: `📋 Nouveau projet en attente de validation - ${newProject.title}`,
                html: getAdminProjectValidationNotificationHtml(
                  newProject.title,
                  newProject.id,
                  newProject.description,
                  adminDashboardUrl
                ),
                type: 'noreply'
              });
              console.log("✅ Email de notification support envoyé");
            } catch (emailError) {
              console.error('❌ Erreur envoi email support (configuration manquante):', emailError);
              // Ne pas bloquer la création du projet si l'email n'est pas envoyé
            }
        } catch (notifError) {
          console.error("❌ Erreur lors de l'envoi de la notification admin:", notifError);
          // Ne pas bloquer la création du projet si l'email n'est pas envoyé
        }
      } else {
        console.log("✅ Projet publié automatiquement - pas de notification admin nécessaire");
      }

      return newProject;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  },

  async uploadProjectImages(projectId: string, files: File[]): Promise<{ data: string[] | null, error: Error | null }> {
    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/${Date.now()}_${i}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('project-images')
          .upload(fileName, file);

        if (error) throw error;
        
        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrl);
      }

      // Mettre à jour le projet avec les URLs des images
      const { error: updateError } = await supabase
        .from('projects')
        .update({ photos: uploadedUrls })
        .eq('id', projectId);

      if (updateError) throw updateError;

      return { data: uploadedUrls, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async getPendingProjects(): Promise<{ data: Project[] | null, error: Error | null }> {
    try {
      const query = supabase
        .from('projects')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  async updateProjectStatus(projectId: string, newStatus: string, rejectionReason?: string): Promise<{ data: Project | null, error: Error | null }> {
    try {
      // D'abord, récupérer le projet et ses infos avant la mise à jour
      const { data: projectBefore } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      // Mettre à jour le statut (utiliser 'any' pour contourner les types obsolètes)
      const { data, error } = await supabase
        .from('projects')
        .update({
          status: newStatus as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      // Envoyer des notifications par email selon le nouveau statut
      if (projectBefore) {
        try {
          // Récupérer les infos du client pour l'email
          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('id', projectBefore.client_id)
            .single();

          const clientEmail = clientProfile?.email;

          if (newStatus === 'active' && clientEmail) {
            // Projet approuvé - envoyer email de congratulations
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
            const projectUrl = `${baseUrl}/projets/${projectId}`;

            await axios.post("/api/send-email", {
              to: clientEmail,
              subject: `✅ Votre projet "${projectBefore.title}" a été approuvé!`,
              html: getProjectApprovedNotificationHtml(projectBefore.title, projectUrl),
              type: "noreply",
            });

            console.log("✅ Email d'approbation envoyé à", clientEmail);

            // Envoyer au TEAM pour qualification et appel
            await axios.post("/api/send-email", {
              to: "team@swipetonpro.fr",
              subject: `🚀 Projet qualifié à appeler - ${projectBefore.title}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #f59e0b;">🚀 Projet qualifié - Appel client requis</h2>
                  <p>Bonjour Team,</p>
                  <p>Le projet suivant a été validé par le support et nécessite votre intervention pour qualification complète :</p>
                  
                  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <h3 style="margin: 0 0 10px 0;">📋 Détails du projet :</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                      <li><strong>Titre :</strong> ${projectBefore.title}</li>
                      <li><strong>Catégorie :</strong> ${projectBefore.category}</li>
                      <li><strong>Ville :</strong> ${projectBefore.city}</li>
                      <li><strong>Client :</strong> ${clientEmail}</li>
                      <li><strong>Budget :</strong> ${projectBefore.estimated_budget_min}€ - ${projectBefore.estimated_budget_max}€</li>
                      ${projectBefore.ai_analysis ? `<li><strong>Estimation IA :</strong> ${projectBefore.ai_analysis}</li>` : ''}
                    </ul>
                  </div>
                  
                  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0;">📞 Actions requises :</h3>
                    <ol style="margin: 0; padding-left: 20px;">
                      <li><strong>Consulter le CRM</strong> → Vérifier informations client</li>
                      <li><strong>Appeler le client</strong> → Confirmer numéro et identité</li>
                      <li><strong>Valider le projet</strong> → Confirmer besoins réels</li>
                      <li><strong>Qualifier le client</strong> → Éligibilité et motivation</li>
                      <li><strong>Mettre à jour le CRM</strong> → Notes et statut qualification</li>
                    </ol>
                  </div>
                  
                  <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <h3 style="margin: 0 0 10px 0;">⚠️ Points de vigilance :</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                      <li>Vérifier l'authenticité du demande</li>
                      <li>Confirmer le budget disponible</li>
                      <li>Valider l'urgence réelle</li>
                      <li>Identifier les décideurs</li>
                    </ul>
                  </div>
                  
                  <p>
                    <a href="${projectUrl}" style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      Voir le projet complet
                    </a>
                  </p>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      <strong>Important :</strong> La qualification complète du client est essentielle avant toute mise en relation.
                    </p>
                  </div>
                </div>
              `,
              type: 'noreply'
            });
            console.log("✅ Email de qualification envoyé à la TEAM");

          } else if (newStatus === 'rejected' && clientEmail) {
            // Projet rejeté - envoyer email de notification
            await axios.post("/api/send-email", {
              to: clientEmail,
              subject: `📋 Avis concernant votre projet "${projectBefore.title}"`,
              html: getProjectRejectedNotificationHtml(projectBefore.title, rejectionReason),
              type: "noreply",
            });

            console.log("✅ Email de rejet envoyé à", clientEmail);
          }
        } catch (emailError) {
          console.error("⚠️ Erreur lors de l'envoi de l'email de notification:", emailError);
          // Ne pas bloquer la mise à jour si l'email échoue
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
};
