import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Mail, Users, Save, CheckCircle } from "lucide-react";

interface NotificationSetting {
  id: string;
  notification_type: string;
  recipients: string[];
  is_enabled: boolean;
  subject_template: string | null;
  message_template: string | null;
  description: string;
}

interface WelcomeMessage {
  id: string;
  message_type: 'pro' | 'client';
  subject: string;
  html_content: string;
  is_active: boolean;
  available_variables: string[];
}

export default function SignupNotificationsPage() {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([]);
  const [welcomeMessages, setWelcomeMessages] = useState<WelcomeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRecipients = [
    { id: 'admin', label: 'Admin', email: 'admin@swipetonpro.fr' },
    { id: 'support', label: 'Support', email: 'support@swipetonpro.fr' },
    { id: 'team', label: 'Team', email: 'team@swipetonpro.fr' },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Récupérer les paramètres de notification
      const { data: notifData, error: notifError } = await supabase
        .from('notification_settings')
        .select('*')
        .order('notification_type');

      if (notifError) throw notifError;
      
      // Récupérer les messages de bienvenue
      const { data: welcomeData, error: welcomeError } = await supabase
        .from('welcome_messages')
        .select('*')
        .eq('is_active', true)
        .order('message_type');

      if (welcomeError) throw welcomeError;

      setNotificationSettings(notifData || []);
      setWelcomeMessages(welcomeData || []);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotification = async (settingId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .update({ is_enabled: enabled })
        .eq('id', settingId);

      if (error) throw error;

      setNotificationSettings(prev => 
        prev.map(s => s.id === settingId ? { ...s, is_enabled: enabled } : s)
      );
    } catch (err) {
      console.error('Error updating notification:', err);
      setError('Erreur lors de la mise à jour');
    }
  };

  const handleRecipientsChange = async (settingId: string, recipient: string, checked: boolean) => {
    try {
      const setting = notificationSettings.find(s => s.id === settingId);
      if (!setting) return;

      let newRecipients: string[];
      if (checked) {
        newRecipients = [...setting.recipients, recipient];
      } else {
        newRecipients = setting.recipients.filter(r => r !== recipient);
      }

      const { error } = await supabase
        .from('notification_settings')
        .update({ recipients: newRecipients })
        .eq('id', settingId);

      if (error) throw error;

      setNotificationSettings(prev => 
        prev.map(s => s.id === settingId ? { ...s, recipients: newRecipients } : s)
      );
    } catch (err) {
      console.error('Error updating recipients:', err);
      setError('Erreur lors de la mise à jour des destinataires');
    }
  };

  const handleSaveWelcomeMessage = async (messageId: string, subject: string, content: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('welcome_messages')
        .update({ 
          subject,
          html_content: content,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      setWelcomeMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, subject, html_content: content } : m)
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving welcome message:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getNotificationLabel = (type: string) => {
    const labels: Record<string, string> = {
      'pro_signup': 'Inscription Professionnel',
      'client_signup': 'Inscription Particulier',
    };
    return labels[type] || type;
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('pro')) return <Users className="h-5 w-5 text-purple-500" />;
    return <Users className="h-5 w-5 text-blue-500" />;
  };

  if (loading) {
    return (
      <AdminLayout title="Notifications d'inscription">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <SEO title="Notifications d'inscription - Admin" description="Configurer les notifications de création de compte" />
      <AdminLayout title="Notifications d'inscription">
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">Modifications enregistrées avec succès !</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="notifications" className="space-y-4">
            <TabsList>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications Admin
              </TabsTrigger>
              <TabsTrigger value="welcome" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Messages de bienvenue
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications aux équipes</CardTitle>
                  <CardDescription>
                    Choisissez qui reçoit les notifications lors des inscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {notificationSettings.map((setting) => (
                    <div key={setting.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getNotificationIcon(setting.notification_type)}
                          <div>
                            <h3 className="font-semibold">{getNotificationLabel(setting.notification_type)}</h3>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={setting.is_enabled}
                          onCheckedChange={(checked) => handleToggleNotification(setting.id, checked)}
                        />
                      </div>

                      {setting.is_enabled && (
                        <div className="pl-8 space-y-3">
                          <Label className="text-sm font-medium">Destinataires :</Label>
                          <div className="flex flex-wrap gap-4">
                            {availableRecipients.map((recipient) => (
                              <div key={recipient.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${setting.id}-${recipient.id}`}
                                  checked={setting.recipients.includes(recipient.id)}
                                  onCheckedChange={(checked) => 
                                    handleRecipientsChange(setting.id, recipient.id, checked as boolean)
                                  }
                                />
                                <Label 
                                  htmlFor={`${setting.id}-${recipient.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {recipient.label}
                                  <span className="text-muted-foreground ml-1">({recipient.email})</span>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="welcome" className="space-y-4">
              {welcomeMessages.map((message) => (
                <Card key={message.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Message de bienvenue - {message.message_type === 'pro' ? 'Professionnels' : 'Particuliers'}
                    </CardTitle>
                    <CardDescription>
                      Personnalisez l'email de bienvenue envoyé aux nouveaux utilisateurs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`subject-${message.id}`}>Sujet de l'email</Label>
                      <input
                        id={`subject-${message.id}`}
                        type="text"
                        defaultValue={message.subject}
                        className="w-full px-3 py-2 border rounded-md"
                        onBlur={(e) => handleSaveWelcomeMessage(message.id, e.target.value, message.html_content)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`content-${message.id}`}>Contenu HTML</Label>
                      <textarea
                        id={`content-${message.id}`}
                        rows={10}
                        defaultValue={message.html_content}
                        className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                        onBlur={(e) => handleSaveWelcomeMessage(message.id, message.subject, e.target.value)}
                      />
                    </div>

                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium mb-2">Variables disponibles :</p>
                      <div className="flex flex-wrap gap-2">
                        {message.available_variables.map((variable) => (
                          <code key={variable} className="text-xs bg-background px-2 py-1 rounded">
                            {`{{${variable}}}`}
                          </code>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </>
  );
}
