import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { defaultSystemEmailTemplates, SystemEmailTemplates } from "@/lib/systemEmailTemplates";
import { supabase } from "@/integrations/supabase/client";

export default function AdminSystemEmails() {
  const [templates, setTemplates] = useState<SystemEmailTemplates>(defaultSystemEmailTemplates);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Charger depuis Supabase
    const fetchTemplates = async () => {
      try {
        // Note: settings_emails est une table custom non disponible dans les types Supabase auto-générés
        // À implémenter avec un rpc ou une requête custom
        // const { data, error } = await supabase
        //   .from("settings_emails")
        //   .select("type, subject, body")
        //   .in("type", ["welcome", "matching"]);
        // if (data && data.length) {
        //   const obj: SystemEmailTemplates = { ...defaultSystemEmailTemplates };
        //   data.forEach((tpl: any) => {
        //     if (tpl.type === "welcome") obj.welcome = { subject: tpl.subject, body: tpl.body };
        //     if (tpl.type === "matching") obj.matching = { subject: tpl.subject, body: tpl.body };
        //   });
        //   setTemplates(obj);
        // }
      } catch (error) {
        console.error("Error fetching templates:", error);
      }
    };
    fetchTemplates();
  }, []);

  const handleChange = (key: keyof SystemEmailTemplates, field: "subject" | "body", value: string) => {
    setTemplates((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Update chaque template dans Supabase
      // Note: settings_emails est une table custom non disponible dans les types Supabase auto-générés
      // À implémenter avec un rpc ou une requête custom
      // await supabase
      //   .from("settings_emails")
      //   .update({ subject: templates.welcome.subject, body: templates.welcome.body, updated_at: new Date().toISOString() })
      //   .eq("type", "welcome");
      // await supabase
      //   .from("settings_emails")
      //   .update({ subject: templates.matching.subject, body: templates.matching.body, updated_at: new Date().toISOString() })
      //   .eq("type", "matching");
    } catch (error) {
      console.error("Error saving templates:", error);
    }
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <SEO title="Templates Emails Système - Admin" description="Modifier les emails automatiques (bienvenue, matching)" />
      <AdminLayout title="Templates Emails Système">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Emails automatiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Bienvenue */}
            <div className="space-y-2">
              <Label>Sujet email de bienvenue</Label>
              <Input
                value={templates.welcome.subject}
                onChange={e => handleChange('welcome', 'subject', e.target.value)}
              />
              <Label>Corps (HTML autorisé)</Label>
              <Textarea
                value={templates.welcome.body}
                onChange={e => handleChange('welcome', 'body', e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            {/* Matching */}
            <div className="space-y-2">
              <Label>Sujet email de matching</Label>
              <Input
                value={templates.matching.subject}
                onChange={e => handleChange('matching', 'subject', e.target.value)}
              />
              <Label>Corps (HTML autorisé)</Label>
              <Textarea
                value={templates.matching.body}
                onChange={e => handleChange('matching', 'body', e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={handleSave} disabled={loading} className="mt-4 w-full">
              {saved ? "Enregistré !" : "Enregistrer"}
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    </>
  );
}
