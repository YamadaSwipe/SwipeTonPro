import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { defaultHomepageStatsConfig, HomepageStatsConfig } from "@/lib/homepageStatsConfig";
import { supabase } from "@/integrations/supabase/client";

export default function AdminHomepageStats() {
  const [config, setConfig] = useState<HomepageStatsConfig>(defaultHomepageStatsConfig);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Charger depuis Supabase
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from("settings_homepage")
        .select("id, projects, professionals, satisfaction, response_time, steps")
        .limit(1)
        .single();
      if (data) {
        setConfig({
          projects: data.projects,
          professionals: data.professionals,
          satisfaction: data.satisfaction,
          responseTime: data.response_time,
          steps: typeof data.steps === "string" ? JSON.parse(data.steps) : data.steps || defaultHomepageStatsConfig.steps
        });
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (field: keyof HomepageStatsConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleStepChange = (index: number, key: "title" | "description", value: string) => {
    setConfig((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) => i === index ? { ...step, [key]: value } : step)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    // Récupérer l'id de la config existante (on suppose une seule ligne)
    const { data: existing } = await supabase
      .from("settings_homepage")
      .select("id")
      .limit(1)
      .single();
      if (existing) {
        await supabase
          .from("settings_homepage")
          .update({
            projects: config.projects,
            professionals: config.professionals,
            satisfaction: config.satisfaction,
            response_time: config.responseTime,
            steps: JSON.stringify(config.steps),
            updated_at: new Date().toISOString()
          })
          .eq("id", existing.id);
      }
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <SEO title="Chiffres & Étapes - Admin" description="Modifier les chiffres clés et les étapes onboarding de la homepage" />
      <AdminLayout title="Chiffres & Étapes Homepage">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Chiffres clés & Étapes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Chiffres */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Projets actifs</Label>
                <Input value={config.projects} onChange={e => handleChange('projects', e.target.value)} />
              </div>
              <div>
                <Label>Professionnels</Label>
                <Input value={config.professionals} onChange={e => handleChange('professionals', e.target.value)} />
              </div>
              <div>
                <Label>Satisfaction client</Label>
                <Input value={config.satisfaction} onChange={e => handleChange('satisfaction', e.target.value)} />
              </div>
              <div>
                <Label>Réponse moyenne</Label>
                <Input value={config.responseTime} onChange={e => handleChange('responseTime', e.target.value)} />
              </div>
            </div>
            {/* Étapes */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Étapes "Comment ça marche"</h2>
              {config.steps.map((step, i) => (
                <div key={i} className="space-y-2">
                  <Label>{`Titre étape ${i + 1}`}</Label>
                  <Input value={step.title} onChange={e => handleStepChange(i, 'title', e.target.value)} />
                  <Label>{`Description étape ${i + 1}`}</Label>
                  <Textarea value={step.description} onChange={e => handleStepChange(i, 'description', e.target.value)} rows={2} />
                </div>
              ))}
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
