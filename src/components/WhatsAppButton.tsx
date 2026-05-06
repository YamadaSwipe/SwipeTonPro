import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppSettings {
  phone_number: string;
  default_message: string;
  is_enabled: boolean;
  position: string;
  show_on_mobile: boolean;
  show_on_desktop: boolean;
}

export function WhatsAppButton() {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_whatsapp_settings');

        if (error) throw error;
        
        if (data && data.length > 0) {
          setSettings(data[0]);
        }
      } catch (err) {
        console.error('Erreur chargement WhatsApp settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Masquer si chargement, désactivé, ou pas de numéro
  if (loading || !settings?.is_enabled || !settings?.phone_number) {
    return null;
  }

  // Détecter mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (isMobile && !settings.show_on_mobile) return null;
  if (!isMobile && !settings.show_on_desktop) return null;

  // Formater le numéro (enlever espaces, +, etc.)
  const cleanNumber = settings.phone_number.replace(/[^\d]/g, '');
  
  if (!cleanNumber) return null;

  // Créer le lien WhatsApp
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(settings.default_message)}`;

  // Déterminer la position
  const positionClasses: Record<string, string> = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-24 right-6',
    'top-left': 'top-24 left-6',
  };

  const positionClass = positionClasses[settings.position] || 'bottom-6 right-6';

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed ${positionClass} z-50 group`}
      aria-label="Contact via WhatsApp"
    >
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Discuter sur WhatsApp
        <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900" />
      </div>

      {/* Bouton */}
      <div className="flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
        <MessageCircle className="w-7 h-7" />
      </div>
    </a>
  );
}
