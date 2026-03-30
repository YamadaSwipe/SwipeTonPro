import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Users, Eye, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserRole = Database["public"]["Enums"]["user_role"];

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "welcome",
    name: "Bienvenue",
    subject: "Bienvenue sur SwipeTonPro !",
    body: `<h1>Bienvenue sur SwipeTonPro !</h1>
<p>Nous sommes ravis de vous accueillir sur notre plateforme.</p>
<p>Commencez dès maintenant à explorer les opportunités qui s'offrent à vous.</p>
<p>Cordialement,<br>L'équipe SwipeTonPro</p>`,
  },
  {
    id: "newsletter",
    name: "Newsletter",
    subject: "Nouveautés SwipeTonPro",
    body: `<h1>Les nouveautés du mois</h1>
<p>Découvrez les dernières fonctionnalités et améliorations de SwipeTonPro.</p>
<ul>
  <li>Nouvelle fonctionnalité 1</li>
  <li>Amélioration 2</li>
  <li>Mise à jour 3</li>
</ul>
<p>Cordialement,<br>L'équipe SwipeTonPro</p>`,
  },
  {
    id: "promo",
    name: "Promotion",
    subject: "Offre spéciale : -20% sur les crédits",
    body: `<h1>Offre exceptionnelle !</h1>
<p>Profitez de -20% sur tous les packs de crédits jusqu'à la fin du mois.</p>
<p>Utilisez le code promo : <strong>PROMO20</strong></p>
<p>Cordialement,<br>L'équipe SwipeTonPro</p>`,
  },
];

export default function AdminEmailsPage() {
  const [recipientType, setRecipientType] = useState<"all" | "role" | "custom">("all");
  const [selectedRole, setSelectedRole] = useState<UserRole>("client");
  const [customEmails, setCustomEmails] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState({ total: 0, clients: 0, pros: 0 });
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("role");

    if (profiles) {
      setStats({
        total: profiles.length,
        clients: profiles.filter(p => p.role === "client").length,
        pros: profiles.filter(p => p.role === "professional").length,
      });
    }
  }

  function applyTemplate(templateId: string) {
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
      setSelectedTemplate(templateId);
    }
  }

  async function getRecipients(): Promise<string[]> {
    if (recipientType === "custom") {
      return customEmails.split(",").map(e => e.trim()).filter(Boolean);
    }

    let query = supabase.from("profiles").select("email");

    if (recipientType === "role") {
      query = query.eq("role", selectedRole);
    }

    const { data } = await query;
    return data?.map(p => p.email).filter(Boolean) as string[] || [];
  }

  async function sendEmails() {
    if (!subject || !body) {
      toast({
        title: "❌ Erreur",
        description: "Veuillez remplir le sujet et le corps du message",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const recipients = await getRecipients();

      if (recipients.length === 0) {
        toast({
          title: "❌ Erreur",
          description: "Aucun destinataire trouvé",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      // Envoi groupé (par batch de 50 pour éviter les timeouts)
      const batchSize = 50;
      let sent = 0;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);

        await Promise.all(
          batch.map(email =>
            fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: email,
                subject,
                html: body,
                type: "team",
              }),
            })
          )
        );

        sent += batch.length;

        toast({
          title: "📨 Envoi en cours...",
          description: `${sent}/${recipients.length} emails envoyés`,
        });
      }

      toast({
        title: "✅ Emails envoyés !",
        description: `${recipients.length} emails envoyés avec succès`,
      });

      // Réinitialiser le formulaire
      setSubject("");
      setBody("");
      setSelectedTemplate("");
      setCustomEmails("");
    } catch (error) {
      console.error("Error sending emails:", error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de l'envoi des emails",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <SEO 
        title="Gestion des Emails - Admin SwipeTonPro"
        description="Envoyez des emails groupés aux utilisateurs"
      />
      
      <AdminLayout title="Gestion des Emails">
        <div className="space-y-6">
          {/* En-tête */}
          <div>
            <h1 className="text-3xl font-bold">Gestion des Emails</h1>
            <p className="text-muted-foreground">
              Envoyez des emails groupés à vos utilisateurs
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Utilisateurs totaux</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 text-green-700">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.clients}</p>
                    <p className="text-sm text-muted-foreground">Particuliers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pros}</p>
                    <p className="text-sm text-muted-foreground">Professionnels</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="compose">
            <TabsList>
              <TabsTrigger value="compose">
                <Mail className="w-4 h-4 mr-2" />
                Composer
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-2" />
                Aperçu
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose">
              <Card>
                <CardHeader>
                  <CardTitle>Composer un email</CardTitle>
                  <CardDescription>
                    Rédigez et envoyez des emails à vos utilisateurs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Templates */}
                  <div className="space-y-2">
                    <Label>Modèle (optionnel)</Label>
                    <Select value={selectedTemplate} onValueChange={applyTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un modèle" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMAIL_TEMPLATES.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Destinataires */}
                  <div className="space-y-2">
                    <Label>Destinataires</Label>
                    <Select value={recipientType} onValueChange={(value: any) => setRecipientType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les utilisateurs ({stats.total})</SelectItem>
                        <SelectItem value="role">Par rôle</SelectItem>
                        <SelectItem value="custom">Adresses personnalisées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {recipientType === "role" && (
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Particuliers ({stats.clients})</SelectItem>
                          <SelectItem value="professional">Professionnels ({stats.pros})</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="moderator">Modérateurs</SelectItem>
                          <SelectItem value="admin">Administrateurs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {recipientType === "custom" && (
                    <div className="space-y-2">
                      <Label>Adresses emails (séparées par des virgules)</Label>
                      <Textarea
                        placeholder="email1@example.com, email2@example.com"
                        value={customEmails}
                        onChange={(e) => setCustomEmails(e.target.value)}
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Sujet */}
                  <div className="space-y-2">
                    <Label>Sujet</Label>
                    <Input
                      placeholder="Sujet de l'email"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  {/* Corps */}
                  <div className="space-y-2">
                    <Label>Message (HTML autorisé)</Label>
                    <Textarea
                      placeholder="Corps du message..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={sendEmails}
                      disabled={sending}
                      className="flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sending ? "Envoi en cours..." : "Envoyer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Aperçu de l'email</CardTitle>
                  <CardDescription>
                    Visualisez votre email avant envoi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-6 bg-white">
                    <div className="mb-4 pb-4 border-b">
                      <p className="text-sm text-muted-foreground">Sujet :</p>
                      <p className="font-semibold">{subject || "(Aucun sujet)"}</p>
                    </div>
                    <div
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: body || "<p>(Aucun contenu)</p>" }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </>
  );
}