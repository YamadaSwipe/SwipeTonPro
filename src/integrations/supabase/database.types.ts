export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      settings_homepage: {
        Row: {
          id: string;
          projects: string;
          professionals: string;
          satisfaction: string;
          response_time: string;
          steps: Json;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          projects: string;
          professionals: string;
          satisfaction: string;
          response_time: string;
          steps: Json;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          projects?: string;
          professionals?: string;
          satisfaction?: string;
          response_time?: string;
          steps?: Json;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      admin_actions: {
        Row: {
          action_type: string;
          admin_id: string;
          created_at: string | null;
          details: Json;
          id: string;
          ip_address: string | null;
          target_id: string | null;
          target_type: string | null;
          user_agent: string | null;
        };
        Insert: {
          action_type: string;
          admin_id: string;
          created_at?: string | null;
          details?: Json;
          id?: string;
          ip_address?: string | null;
          target_id?: string | null;
          target_type?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action_type?: string;
          admin_id?: string;
          created_at?: string | null;
          details?: Json;
          id?: string;
          ip_address?: string | null;
          target_id?: string | null;
          target_type?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'admin_actions_admin_id_fkey';
            columns: ['admin_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      bids: {
        Row: {
          created_at: string | null;
          credits_spent: number | null;
          estimated_duration: number | null;
          id: string;
          message: string | null;
          professional_id: string;
          project_id: string;
          proposed_price: number;
          status: Database['public']['Enums']['bid_status'] | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          credits_spent?: number | null;
          estimated_duration?: number | null;
          id?: string;
          message?: string | null;
          professional_id: string;
          project_id: string;
          proposed_price: number;
          status?: Database['public']['Enums']['bid_status'] | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          credits_spent?: number | null;
          estimated_duration?: number | null;
          id?: string;
          message?: string | null;
          professional_id?: string;
          project_id?: string;
          proposed_price?: number;
          status?: Database['public']['Enums']['bid_status'] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'bids_professional_id_fkey';
            columns: ['professional_id'];
            isOneToOne: false;
            referencedRelation: 'professionals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bids_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          client_id: string;
          client_unread_count: number | null;
          created_at: string | null;
          id: string;
          last_message_at: string | null;
          professional_id: string;
          professional_unread_count: number | null;
          project_id: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          client_id: string;
          client_unread_count?: number | null;
          created_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          professional_id: string;
          professional_unread_count?: number | null;
          project_id: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string;
          client_unread_count?: number | null;
          created_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          professional_id?: string;
          professional_unread_count?: number | null;
          project_id?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_professional_id_fkey';
            columns: ['professional_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      credit_transactions: {
        Row: {
          amount: number;
          balance_after: number;
          created_at: string | null;
          created_by: string | null;
          description: string;
          id: string;
          metadata: Json | null;
          professional_id: string;
          reference_id: string | null;
          reference_type: string | null;
          type: string;
        };
        Insert: {
          amount: number;
          balance_after: number;
          created_at?: string | null;
          created_by?: string | null;
          description: string;
          id?: string;
          metadata?: Json | null;
          professional_id: string;
          reference_id?: string | null;
          reference_type?: string | null;
          type: string;
        };
        Update: {
          amount?: number;
          balance_after?: number;
          created_at?: string | null;
          created_by?: string | null;
          description?: string;
          id?: string;
          metadata?: Json | null;
          professional_id?: string;
          reference_id?: string | null;
          reference_type?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'credit_transactions_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'credit_transactions_professional_id_fkey';
            columns: ['professional_id'];
            isOneToOne: false;
            referencedRelation: 'professionals';
            referencedColumns: ['id'];
          },
        ];
      };
      documents: {
        Row: {
          created_at: string | null;
          file_name: string;
          file_url: string;
          id: string;
          professional_id: string;
          rejection_reason: string | null;
          status: Database['public']['Enums']['document_status'] | null;
          type: Database['public']['Enums']['document_type'];
          updated_at: string | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          file_name: string;
          file_url: string;
          id?: string;
          professional_id: string;
          rejection_reason?: string | null;
          status?: Database['public']['Enums']['document_status'] | null;
          type: Database['public']['Enums']['document_type'];
          updated_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          file_name?: string;
          file_url?: string;
          id?: string;
          professional_id?: string;
          rejection_reason?: string | null;
          status?: Database['public']['Enums']['document_status'] | null;
          type?: Database['public']['Enums']['document_type'];
          updated_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_professional_id_fkey';
            columns: ['professional_id'];
            isOneToOne: false;
            referencedRelation: 'professionals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_verified_by_fkey';
            columns: ['verified_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      match_payments: {
        Row: {
          amount: number;
          created_at: string | null;
          currency: string;
          id: string;
          metadata: Json | null;
          paid_at: string | null;
          professional_id: string;
          project_id: string;
          status: string;
          stripe_charge_id: string | null;
          stripe_payment_intent_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          amount?: number;
          created_at?: string | null;
          currency?: string;
          id?: string;
          metadata?: Json | null;
          paid_at?: string | null;
          professional_id: string;
          project_id: string;
          status?: string;
          stripe_charge_id?: string | null;
          stripe_payment_intent_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          currency?: string;
          id?: string;
          metadata?: Json | null;
          paid_at?: string | null;
          professional_id?: string;
          project_id?: string;
          status?: string;
          stripe_charge_id?: string | null;
          stripe_payment_intent_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'match_payments_professional_id_fkey';
            columns: ['professional_id'];
            isOneToOne: false;
            referencedRelation: 'professionals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_payments_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          attachments: Json | null;
          content: string;
          conversation_id: string;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          sender_id: string;
          updated_at: string | null;
        };
        Insert: {
          attachments?: Json | null;
          content: string;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          sender_id: string;
          updated_at?: string | null;
        };
        Update: {
          attachments?: Json | null;
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          sender_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string | null;
          data: Json | null;
          id: string;
          is_read: boolean | null;
          message: string;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      permissions: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          setting_key: string;
          setting_value: Json;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          setting_key: string;
          setting_value: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          setting_key?: string;
          setting_value?: Json;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'platform_settings_updated_by_fkey';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      pricing_config: {
        Row: {
          created_at: string | null;
          currency: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          price: number;
          service_type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          price: number;
          service_type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          price?: number;
          service_type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      professionals: {
        Row: {
          certification_badge: boolean | null;
          certification_date: string | null;
          certifications: Json | null;
          company_name: string;
          coverage_radius: number | null;
          created_at: string | null;
          credits_balance: number | null;
          experience_years: number | null;
          has_eco_artisan: boolean | null;
          has_qualibat: boolean | null;
          has_qualibois: boolean | null;
          has_qualipac: boolean | null;
          has_qualipv: boolean | null;
          has_qualitenr: boolean | null;
          has_rge: boolean | null;
          id: string;
          insurance_expiry_date: string | null;
          other_certifications: string[] | null;
          rating_average: number | null;
          rating_count: number | null;
          siret: string;
          specialties: string[] | null;
          status: Database['public']['Enums']['professional_status'] | null;
          total_projects: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          certification_badge?: boolean | null;
          certification_date?: string | null;
          certifications?: Json | null;
          company_name: string;
          coverage_radius?: number | null;
          created_at?: string | null;
          credits_balance?: number | null;
          experience_years?: number | null;
          has_eco_artisan?: boolean | null;
          has_qualibat?: boolean | null;
          has_qualibois?: boolean | null;
          has_qualipac?: boolean | null;
          has_qualipv?: boolean | null;
          has_qualitenr?: boolean | null;
          has_rge?: boolean | null;
          id?: string;
          insurance_expiry_date?: string | null;
          other_certifications?: string[] | null;
          rating_average?: number | null;
          rating_count?: number | null;
          siret: string;
          specialties?: string[] | null;
          status?: Database['public']['Enums']['professional_status'] | null;
          total_projects?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          certification_badge?: boolean | null;
          certification_date?: string | null;
          certifications?: Json | null;
          company_name?: string;
          coverage_radius?: number | null;
          created_at?: string | null;
          credits_balance?: number | null;
          experience_years?: number | null;
          has_eco_artisan?: boolean | null;
          has_qualibat?: boolean | null;
          has_qualibois?: boolean | null;
          has_qualipac?: boolean | null;
          has_qualipv?: boolean | null;
          has_qualitenr?: boolean | null;
          has_rge?: boolean | null;
          id?: string;
          insurance_expiry_date?: string | null;
          other_certifications?: string[] | null;
          rating_average?: number | null;
          rating_count?: number | null;
          siret?: string;
          specialties?: string[] | null;
          status?: Database['public']['Enums']['professional_status'] | null;
          total_projects?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'professionals_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          address: string | null;
          avatar_url: string | null;
          bio: string | null;
          city: string | null;
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          postal_code: string | null;
          role: Database['public']['Enums']['user_role'] | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          city?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      project_interests: {
        Row: {
          client_interested: boolean | null;
          created_at: string | null;
          id: string;
          payment_deadline: string | null;
          professional_id: string;
          project_id: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          client_interested?: boolean | null;
          created_at?: string | null;
          id?: string;
          payment_deadline?: string | null;
          professional_id: string;
          project_id: string;
          status: string;
          updated_at?: string | null;
        };
        Update: {
          client_interested?: boolean | null;
          created_at?: string | null;
          id?: string;
          payment_deadline?: string | null;
          professional_id?: string;
          project_id?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'project_interests_professional_id_fkey';
            columns: ['professional_id'];
            isOneToOne: false;
            referencedRelation: 'professionals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'project_interests_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          ai_analysis: Json | null;
          bids_count: number | null;
          budget_max: number | null;
          budget_min: number | null;
          category: string;
          city: string;
          client_email: string | null;
          client_first_name: string | null;
          client_id: string;
          client_last_name: string | null;
          client_phone: string | null;
          created_at: string | null;
          description: string;
          desired_deadline: string | null;
          desired_start_date: string | null;
          estimated_budget_max: number | null;
          estimated_budget_min: number | null;
          id: string;
          latitude: number | null;
          location: string;
          longitude: number | null;
          photos: string[] | null;
          photos_optional: boolean | null;
          postal_code: string;
          property_address: string | null;
          property_surface: number | null;
          property_type: string | null;
          required_certifications: string[] | null;
          status: Database['public']['Enums']['project_status'] | null;
          title: string;
          updated_at: string | null;
          urgency: string | null;
          views_count: number | null;
          work_types: Database['public']['Enums']['work_type'][] | null;
        };
        Insert: {
          ai_analysis?: Json | null;
          bids_count?: number | null;
          budget_max?: number | null;
          budget_min?: number | null;
          category: string;
          city: string;
          client_email?: string | null;
          client_first_name?: string | null;
          client_id: string;
          client_last_name?: string | null;
          client_phone?: string | null;
          created_at?: string | null;
          description: string;
          desired_deadline?: string | null;
          desired_start_date?: string | null;
          estimated_budget_max?: number | null;
          estimated_budget_min?: number | null;
          id?: string;
          latitude?: number | null;
          location: string;
          longitude?: number | null;
          photos?: string[] | null;
          photos_optional?: boolean | null;
          postal_code: string;
          property_address?: string | null;
          property_surface?: number | null;
          property_type?: string | null;
          required_certifications?: string[] | null;
          status?: Database['public']['Enums']['project_status'] | null;
          title: string;
          updated_at?: string | null;
          urgency?: string | null;
          views_count?: number | null;
          work_types?: Database['public']['Enums']['work_type'][] | null;
        };
        Update: {
          ai_analysis?: Json | null;
          bids_count?: number | null;
          budget_max?: number | null;
          budget_min?: number | null;
          category?: string;
          city?: string;
          client_email?: string | null;
          client_first_name?: string | null;
          client_id?: string;
          client_last_name?: string | null;
          client_phone?: string | null;
          created_at?: string | null;
          description?: string;
          desired_deadline?: string | null;
          desired_start_date?: string | null;
          estimated_budget_max?: number | null;
          estimated_budget_min?: number | null;
          id?: string;
          latitude?: number | null;
          location?: string;
          longitude?: number | null;
          photos?: string[] | null;
          photos_optional?: boolean | null;
          postal_code?: string;
          property_address?: string | null;
          property_surface?: number | null;
          property_type?: string | null;
          required_certifications?: string[] | null;
          status?: Database['public']['Enums']['project_status'] | null;
          title?: string;
          updated_at?: string | null;
          urgency?: string | null;
          views_count?: number | null;
          work_types?: Database['public']['Enums']['work_type'][] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'projects_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      promo_codes: {
        Row: {
          code: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          discount_type: string;
          discount_value: number;
          id: string;
          is_active: boolean | null;
          max_uses: number | null;
          metadata: Json | null;
          min_purchase_amount: number | null;
          target_user_type: string | null;
          uses_count: number | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          discount_type: string;
          discount_value: number;
          id?: string;
          is_active?: boolean | null;
          max_uses?: number | null;
          metadata?: Json | null;
          min_purchase_amount?: number | null;
          target_user_type?: string | null;
          uses_count?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          id?: string;
          is_active?: boolean | null;
          max_uses?: number | null;
          metadata?: Json | null;
          min_purchase_amount?: number | null;
          target_user_type?: string | null;
          uses_count?: number | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'promo_codes_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      review_helpful: {
        Row: {
          created_at: string | null;
          id: string;
          review_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          review_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          review_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_helpful_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'reviews';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          client_id: string;
          comment: string | null;
          created_at: string | null;
          id: string;
          is_verified: boolean | null;
          professional_id: string;
          professional_response: string | null;
          project_id: string;
          rating: number;
          updated_at: string | null;
        };
        Insert: {
          client_id: string;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          is_verified?: boolean | null;
          professional_id: string;
          professional_response?: string | null;
          project_id: string;
          rating: number;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          is_verified?: boolean | null;
          professional_id?: string;
          professional_response?: string | null;
          project_id?: string;
          rating?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_client_id_fkey';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_professional_id_fkey';
            columns: ['professional_id'];
            isOneToOne: false;
            referencedRelation: 'professionals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string | null;
          id: string;
          permission_id: string;
          role: Database['public']['Enums']['user_role'];
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          permission_id: string;
          role: Database['public']['Enums']['user_role'];
        };
        Update: {
          created_at?: string | null;
          id?: string;
          permission_id?: string;
          role?: Database['public']['Enums']['user_role'];
        };
        Relationships: [
          {
            foreignKeyName: 'role_permissions_permission_id_fkey';
            columns: ['permission_id'];
            isOneToOne: false;
            referencedRelation: 'permissions';
            referencedColumns: ['id'];
          },
        ];
      };
      stripe_customers: {
        Row: {
          created_at: string | null;
          id: string;
          stripe_customer_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          stripe_customer_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          stripe_customer_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      stripe_payment_intents: {
        Row: {
          amount: number;
          created_at: string | null;
          credits_amount: number;
          currency: string;
          id: string;
          metadata: Json | null;
          status: string;
          stripe_payment_intent_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          credits_amount: number;
          currency?: string;
          id?: string;
          metadata?: Json | null;
          status: string;
          stripe_payment_intent_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          credits_amount?: number;
          currency?: string;
          id?: string;
          metadata?: Json | null;
          status?: string;
          stripe_payment_intent_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number };
        Returns: number;
      };
      create_paid_match: {
        Args: {
          p_professional_id: string;
          p_project_id: string;
          p_stripe_payment_intent_id: string;
        };
        Returns: {
          match_id: string;
          message: string;
          payment_id: string;
          success: boolean;
        }[];
      };
      expire_payment_pending_interests: { Args: never; Returns: undefined };
      get_matching_professionals: {
        Args: { p_limit?: number; p_project_id: string };
        Returns: {
          average_rating: number;
          company_name: string;
          distance_km: number;
          is_verified: boolean;
          match_score: number;
          matching_skills: string[];
          professional_id: string;
        }[];
      };
      get_matching_projects: {
        Args: {
          p_limit?: number;
          p_offset?: number;
          p_professional_id: string;
        };
        Returns: {
          city: string;
          created_at: string;
          distance_km: number;
          match_score: number;
          matching_skills: string[];
          project_id: string;
          title: string;
        }[];
      };
      get_professional_average_rating: {
        Args: { prof_id: string };
        Returns: number;
      };
      get_professional_review_count: {
        Args: { prof_id: string };
        Returns: number;
      };
      get_user_permissions: {
        Args: { user_id: string };
        Returns: {
          permission_category: string;
          permission_description: string;
          permission_name: string;
        }[];
      };
      increment_promo_usage: {
        Args: { promo_code: string };
        Returns: undefined;
      };
      user_has_permission: {
        Args: { permission_name: string; user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      bid_status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
      credit_transaction_type:
        | 'purchase'
        | 'bid'
        | 'refund'
        | 'bonus'
        | 'usage'
        | 'spend'
        | 'penalty';
      document_status: 'pending' | 'verified' | 'rejected';
      document_type: 'siret' | 'insurance' | 'portfolio' | 'identity';
      notification_type:
        | 'new_project'
        | 'new_bid'
        | 'bid_accepted'
        | 'bid_rejected'
        | 'credit_low'
        | 'message'
        | 'system';
      professional_status: 'pending' | 'verified' | 'rejected' | 'suspended';
      project_status:
        | 'draft'
        | 'pending'
        | 'published'
        | 'in_progress'
        | 'completed'
        | 'cancelled';
      user_role:
        | 'client'
        | 'professional'
        | 'admin'
        | 'support'
        | 'moderator'
        | 'super_admin';
      work_type:
        | 'renovation_complete'
        | 'plomberie'
        | 'electricite'
        | 'peinture'
        | 'carrelage'
        | 'maconnerie'
        | 'menuiserie'
        | 'isolation'
        | 'climatisation'
        | 'pompe_a_chaleur'
        | 'fenetres'
        | 'panneaux_solaires'
        | 'autre';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      bid_status: ['pending', 'accepted', 'rejected', 'withdrawn'],
      credit_transaction_type: ['purchase', 'bid', 'refund', 'bonus'],
      document_status: ['pending', 'verified', 'rejected'],
      document_type: ['siret', 'insurance', 'portfolio', 'identity'],
      notification_type: [
        'new_project',
        'new_bid',
        'bid_accepted',
        'bid_rejected',
        'credit_low',
        'message',
        'system',
      ],
      professional_status: ['pending', 'verified', 'rejected', 'suspended'],
      project_status: [
        'draft',
        'pending',
        'published',
        'in_progress',
        'completed',
        'cancelled',
      ],
      user_role: [
        'client',
        'professional',
        'admin',
        'support',
        'moderator',
        'super_admin',
      ],
      work_type: [
        'renovation_complete',
        'plomberie',
        'electricite',
        'peinture',
        'carrelage',
        'maconnerie',
        'menuiserie',
        'isolation',
        'climatisation',
        'pompe_a_chaleur',
        'fenetres',
        'panneaux_solaires',
        'autre',
      ],
    },
  },
};
