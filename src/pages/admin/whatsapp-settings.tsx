import { useState, useEffect } from 'react';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Save, Smartphone, Monitor, AlertCircle } from 'lucide-react';

interface WhatsAppSettings {
  id?: string;
  phone_number: string;
  default_message: string;
  is_enabled: boolean;
  position: string;
  show_on_mobile: boolean;
  show_on_desktop: boolean;
}

const POSITIONS = [
  { value: 'bottom-right', label: 'Bas droite' },
  { value: 'bottom-left', label: 'Bas gauche' },
  { value: 'top-right', label: 'Haut droite' },
  { value: 'top-left', label: 'Haut gauche' },
];

export default function WhatsAppSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<WhatsAppSettings>({
    phone_number: '',
    default_message: 'Bonjour, j\'ai une question concernant Swipe Ton Pro.',
    is_enabled: true,
    position: 'bottom-right',
    show_on_mobile: true,
    show_on_desktop: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Charger les paramètres
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('whatsapp_settings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setSettings(data);
        }
      } catch (err) {
        console.error('Erreur chargement settings:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les paramètres WhatsApp',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Valider le numéro
      const cleanNumber = settings.phone_number.replace(/[^\d+]/g, '');
      if (!cleanNumber) {
        toast({
          title: 'Numéro requis',
          description: 'Veuillez entrer un numéro de téléphone',
          variant: 'destructive',
        });
        return;
      }

      const updateData = {
        phone_number: cleanNumber,
        default_message: settings.default_message,
        is_enabled: settings.is_enabled,
        position: settings.position,
        show_on_mobile: settings.show_on_mobile,
        show_on_desktop: settings.show_on_desktop,
        updated_at: new Date().toISOString(),
      };

      let error;
      
      if (settings.id) {
        // Mise à jour
        const result = await supabase
          .from('whatsapp_settings')
          .update(updateData)
          .eq('id', settings.id);
        error = result.error;
      } else {
        // Création
        const result = await supabase
          .from('whatsapp_settings')
          .insert([updateData])
          .select()
          .single();
        error = result.error;
        if (result.data) {
          setSettings(prev => ({ ...prev, id: result.data.id }));
        }
      }

      if (error) throw error;

      toast({
        title: 'Paramètres sauvegardés',
        description: 'Le bouton WhatsApp a été mis à jour',
      });
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof WhatsAppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // Générer l'URL de test
  const testUrl = settings.phone_number
    ? `https://wa.me/${settings.phone_number.replace(/[^\d]/g, '')}?text=${encodeURIComponent(settings.default_message)}`
    : null;

  return (
    <>
      <SEO title="Configuration WhatsApp | Admin" />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-[#25D366]" />
            Configuration WhatsApp
          </h1>
          <p className="text-gray-600 mt-2">
            Personnalisez le bouton de contact WhatsApp affiché sur le site
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Activation */}
            <Card>
              <CardHeader>
                <CardTitle>Activation</CardTitle>
                <CardDescription>Activez ou désactivez le bouton WhatsApp</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Activer le bouton</p>
                    <p className="text-sm text-gray-500">Le bouton sera visible sur toutes les pages</p>
                  </div>
                  <Switch
                    checked={settings.is_enabled}
                    onCheckedChange={(checked) => handleChange('is_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Numéro et message */}
            <Card>
              <CardHeader>
                <CardTitle>Numéro et message</CardTitle>
                <CardDescription>Configurez le numéro de contact et le message par défaut</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="phone">Numéro WhatsApp</Label>
                  <Input
                    id="phone"
                    value={settings.phone_number}
                    onChange={(e) => handleChange('phone_number', e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Format international recommandé : +33 6 12 34 56 78
                  </p>
                </div>

                <div>
                  <Label htmlFor="message">Message par défaut</Label>
                  <Input
                    id="message"
                    value={settings.default_message}
                    onChange={(e) => handleChange('default_message', e.target.value)}
                    placeholder="Bonjour..."
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Ce message sera pré-rempli lors de l'ouverture de WhatsApp
                  </p>
                </div>

                {testUrl && (
                  <Alert className="bg-[#25D366]/10 border-[#25D366]/30">
                    <AlertCircle className="h-4 w-4 text-[#25D366]" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Tester le lien WhatsApp</span>
                      <a
                        href={testUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#25D366] hover:underline font-medium"
                      >
                        Ouvrir WhatsApp →
                      </a>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Affichage */}
            <Card>
              <CardHeader>
                <CardTitle>Options d'affichage</CardTitle>
                <CardDescription>Personnalisez l'apparence et la position</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Position du bouton</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {POSITIONS.map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => handleChange('position', pos.value)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          settings.position === pos.value
                            ? 'border-[#25D366] bg-[#25D366]/10 text-[#25D366]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Mobile</p>
                      <p className="text-sm text-gray-500">Afficher sur téléphone</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.show_on_mobile}
                    onCheckedChange={(checked) => handleChange('show_on_mobile', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Desktop</p>
                      <p className="text-sm text-gray-500">Afficher sur ordinateur</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.show_on_desktop}
                    onCheckedChange={(checked) => handleChange('show_on_desktop', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Bouton sauvegarder */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
