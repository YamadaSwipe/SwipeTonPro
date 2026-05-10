import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Eye, EyeOff, Mail, Phone, MapPin, Bot, MessageSquare } from 'lucide-react';

interface ContactSettings {
  email: string;
  phone: string;
  address: string;
  showPhone: boolean;
  showAddress: boolean;
  businessHours: {
    monday_friday: string;
    saturday: string;
    sunday: string;
  };
}

interface ChatbotSettings {
  enabled: boolean;
  welcomeMessage: string;
  offlineMessage: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
}

export default function ContactSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    email: 'contact@swipetonpro.fr',
    phone: '+33 1 23 45 67 89',
    address: '123 Rue de la Construction\n75001 Paris, France',
    showPhone: false,
    showAddress: false,
    businessHours: {
      monday_friday: '9h - 18h',
      saturday: '9h - 12h',
      sunday: 'Fermé'
    }
  });

  const [chatbotSettings, setChatbotSettings] = useState<ChatbotSettings>({
    enabled: true,
    welcomeMessage: 'Bonjour ! Je suis là pour vous aider. Comment puis-je vous assister ?',
    offlineMessage: 'Désolé, je suis actuellement hors ligne. Veuillez nous contacter par email.',
    primaryColor: '#ff6b35',
    position: 'bottom-right'
  });

  useEffect(() => {
    // Charger les paramètres depuis le localStorage ou une API
    const savedContact = localStorage.getItem('contactSettings');
    const savedChatbot = localStorage.getItem('chatbotSettings');
    
    if (savedContact) {
      setContactSettings(JSON.parse(savedContact));
    }
    if (savedChatbot) {
      setChatbotSettings(JSON.parse(savedChatbot));
    }
  }, []);

  const handleContactChange = (field: keyof ContactSettings, value: any) => {
    setContactSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessHoursChange = (field: keyof ContactSettings['businessHours'], value: string) => {
    setContactSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [field]: value
      }
    }));
  };

  const handleChatbotChange = (field: keyof ChatbotSettings, value: any) => {
    setChatbotSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Simuler la sauvegarde (remplacer par vrai appel API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem('contactSettings', JSON.stringify(contactSettings));
      localStorage.setItem('chatbotSettings', JSON.stringify(chatbotSettings));
      
      setSuccess('Paramètres sauvegardés avec succès');
    } catch (err) {
      setError('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SEO
        title="Paramètres Contact & Chatbot - Admin"
        description="Gérer les informations de contact et le chatbot"
      />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Paramètres Contact & Chatbot
            </h1>
            <p className="text-gray-600">
              Gérez les informations de contact et les paramètres du chatbot
            </p>
          </div>

          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Informations de Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div>
                  <Label htmlFor="email">Email de contact</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactSettings.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    placeholder="contact@swipetonpro.fr"
                  />
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="phone"
                      type="tel"
                      value={contactSettings.phone}
                      onChange={(e) => handleContactChange('phone', e.target.value)}
                      placeholder="+33 1 23 45 67 89"
                      disabled={!contactSettings.showPhone}
                    />
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showPhone"
                        checked={contactSettings.showPhone}
                        onCheckedChange={(checked) => handleContactChange('showPhone', checked)}
                      />
                      <Label htmlFor="showPhone" className="flex items-center gap-1">
                        {contactSettings.showPhone ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        Afficher
                      </Label>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Activez pour afficher le numéro sur la page contact
                  </p>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <div className="flex items-start space-x-2">
                    <Textarea
                      id="address"
                      value={contactSettings.address}
                      onChange={(e) => handleContactChange('address', e.target.value)}
                      placeholder="123 Rue de la Construction\n75001 Paris, France"
                      rows={3}
                      disabled={!contactSettings.showAddress}
                    />
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        id="showAddress"
                        checked={contactSettings.showAddress}
                        onCheckedChange={(checked) => handleContactChange('showAddress', checked)}
                      />
                      <Label htmlFor="showAddress" className="flex items-center gap-1">
                        {contactSettings.showAddress ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        Afficher
                      </Label>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Activez pour afficher l'adresse sur la page contact
                  </p>
                </div>

                {/* Business Hours */}
                <div>
                  <Label>Heures d'ouverture</Label>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="monday_friday" className="text-sm">Lundi - Vendredi</Label>
                      <Input
                        id="monday_friday"
                        value={contactSettings.businessHours.monday_friday}
                        onChange={(e) => handleBusinessHoursChange('monday_friday', e.target.value)}
                        placeholder="9h - 18h"
                      />
                    </div>
                    <div>
                      <Label htmlFor="saturday" className="text-sm">Samedi</Label>
                      <Input
                        id="saturday"
                        value={contactSettings.businessHours.saturday}
                        onChange={(e) => handleBusinessHoursChange('saturday', e.target.value)}
                        placeholder="9h - 12h"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sunday" className="text-sm">Dimanche</Label>
                      <Input
                        id="sunday"
                        value={contactSettings.businessHours.sunday}
                        onChange={(e) => handleBusinessHoursChange('sunday', e.target.value)}
                        placeholder="Fermé"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chatbot Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Paramètres Chatbot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enable/Disable Chatbot */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="chatbotEnabled">Activer le chatbot</Label>
                    <p className="text-sm text-gray-500">
                      Afficher le chatbot sur le site
                    </p>
                  </div>
                  <Switch
                    id="chatbotEnabled"
                    checked={chatbotSettings.enabled}
                    onCheckedChange={(checked) => handleChatbotChange('enabled', checked)}
                  />
                </div>

                {/* Welcome Message */}
                <div>
                  <Label htmlFor="welcomeMessage">Message de bienvenue</Label>
                  <Textarea
                    id="welcomeMessage"
                    value={chatbotSettings.welcomeMessage}
                    onChange={(e) => handleChatbotChange('welcomeMessage', e.target.value)}
                    placeholder="Bonjour ! Je suis là pour vous aider..."
                    rows={3}
                    disabled={!chatbotSettings.enabled}
                  />
                </div>

                {/* Offline Message */}
                <div>
                  <Label htmlFor="offlineMessage">Message hors ligne</Label>
                  <Textarea
                    id="offlineMessage"
                    value={chatbotSettings.offlineMessage}
                    onChange={(e) => handleChatbotChange('offlineMessage', e.target.value)}
                    placeholder="Désolé, je suis actuellement hors ligne..."
                    rows={3}
                    disabled={!chatbotSettings.enabled}
                  />
                </div>

                {/* Primary Color */}
                <div>
                  <Label htmlFor="primaryColor">Couleur principale</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={chatbotSettings.primaryColor}
                      onChange={(e) => handleChatbotChange('primaryColor', e.target.value)}
                      className="w-20 h-10"
                      disabled={!chatbotSettings.enabled}
                    />
                    <Input
                      type="text"
                      value={chatbotSettings.primaryColor}
                      onChange={(e) => handleChatbotChange('primaryColor', e.target.value)}
                      placeholder="#ff6b35"
                      disabled={!chatbotSettings.enabled}
                    />
                  </div>
                </div>

                {/* Position */}
                <div>
                  <Label>Position du chatbot</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={chatbotSettings.position === 'bottom-right' ? 'default' : 'outline'}
                      onClick={() => handleChatbotChange('position', 'bottom-right')}
                      disabled={!chatbotSettings.enabled}
                      className="h-12"
                    >
                      Bas droite
                    </Button>
                    <Button
                      type="button"
                      variant={chatbotSettings.position === 'bottom-left' ? 'default' : 'outline'}
                      onClick={() => handleChatbotChange('position', 'bottom-left')}
                      disabled={!chatbotSettings.enabled}
                      className="h-12"
                    >
                      Bas gauche
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                {chatbotSettings.enabled && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Label className="text-sm font-medium mb-2 block">Aperçu</Label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                          chatbotSettings.position === 'bottom-right' ? 'ml-auto' : ''
                        }`}
                        style={{ backgroundColor: chatbotSettings.primaryColor }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex justify-end">
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="px-8"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder les paramètres
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
