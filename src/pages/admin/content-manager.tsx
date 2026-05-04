"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Globe, 
  Mail, 
  HelpCircle, 
  Save, 
  Plus, 
  Trash2, 
  Edit,
  Eye,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Search,
  Layout,
  Type,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ContentPage {
  id: string;
  slug: string;
  title: string;
  meta_description: string;
  content: string;
  is_published: boolean;
  updated_at: string;
  section: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  variables: string[];
  is_active: boolean;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  is_published: boolean;
}

interface HeroSection {
  id: string;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  image_url: string;
  is_active: boolean;
}

export default function ContentManager() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pages");
  const [loading, setLoading] = useState(false);
  
  // Pages
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [pageForm, setPageForm] = useState({
    slug: "",
    title: "",
    meta_description: "",
    content: "",
    section: "general"
  });

  // Email Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  // FAQ
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);

  // Hero Section
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  async function loadContent() {
    setLoading(true);
    try {
      if (activeTab === "pages") {
        const { data } = await supabase.from("content_pages").select("*").order("updated_at", { ascending: false });
        setPages(data || []);
      } else if (activeTab === "emails") {
        const { data } = await supabase.from("email_templates").select("*").order("name");
        setTemplates(data || []);
      } else if (activeTab === "faq") {
        const { data } = await supabase.from("faq_items").select("*").order("order");
        setFaqItems(data || []);
      } else if (activeTab === "hero") {
        const { data } = await supabase.from("hero_sections").select("*").eq("is_active", true).single();
        setHeroSection(data);
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    }
    setLoading(false);
  }

  async function savePage() {
    try {
      const { error } = await supabase.from("content_pages").upsert({
        ...editingPage,
        ...pageForm,
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      toast({ title: "Page sauvegardée", description: "Les modifications ont été enregistrées" });
      setEditingPage(null);
      loadContent();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  }

  async function togglePageStatus(page: ContentPage) {
    try {
      const { error } = await supabase
        .from("content_pages")
        .update({ is_published: !page.is_published })
        .eq("id", page.id);

      if (error) throw error;
      loadContent();
      toast({ title: "Statut mis à jour" });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  }

  return (
    <AdminLayout title="Gestionnaire de Contenu">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Hero
          </TabsTrigger>
        </TabsList>

        {/* PAGES CMS */}
        <TabsContent value="pages" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Pages du site</h2>
              <p className="text-muted-foreground">Gérez le contenu des pages statiques sans coder</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPage(null);
                  setPageForm({ slug: "", title: "", meta_description: "", content: "", section: "general" });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle page
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPage ? "Modifier" : "Créer"} une page</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Slug (URL)</Label>
                      <Input 
                        value={pageForm.slug} 
                        onChange={(e) => setPageForm({...pageForm, slug: e.target.value})}
                        placeholder="ex: mentions-legales"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Section</Label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={pageForm.section}
                        onChange={(e) => setPageForm({...pageForm, section: e.target.value})}
                      >
                        <option value="general">Général</option>
                        <option value="legal">Légal</option>
                        <option value="help">Aide</option>
                        <option value="about">À propos</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Titre de la page</Label>
                    <Input 
                      value={pageForm.title} 
                      onChange={(e) => setPageForm({...pageForm, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Description (SEO)</Label>
                    <Textarea 
                      value={pageForm.meta_description} 
                      onChange={(e) => setPageForm({...pageForm, meta_description: e.target.value})}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contenu (HTML supporté)</Label>
                    <Textarea 
                      value={pageForm.content} 
                      onChange={(e) => setPageForm({...pageForm, content: e.target.value})}
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button onClick={savePage} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {editingPage ? "Sauvegarder" : "Créer la page"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {pages.map((page) => (
              <Card key={page.id} className={page.is_published ? "" : "opacity-70"}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{page.title}</h3>
                        <Badge variant={page.is_published ? "default" : "secondary"}>
                          {page.is_published ? "Publié" : "Brouillon"}
                        </Badge>
                        <Badge variant="outline">{page.section}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">/{page.slug}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {page.meta_description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => togglePageStatus(page)}
                      >
                        {page.is_published ? <Eye className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingPage(page);
                          setPageForm({
                            slug: page.slug,
                            title: page.title,
                            meta_description: page.meta_description,
                            content: page.content,
                            section: page.section
                          });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* EMAIL TEMPLATES */}
        <TabsContent value="emails" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Templates d'emails</h2>
              <p className="text-muted-foreground">Personnalisez les emails automatiques</p>
            </div>
          </div>
          
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Objet: {template.subject}</p>
                      <div className="flex gap-1 mt-2">
                        {template.variables.map((v) => (
                          <Badge key={v} variant="outline" className="text-xs">{`{{${v}}}`}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">FAQ</h2>
              <p className="text-muted-foreground">Gérez les questions fréquentes</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une question
            </Button>
          </div>

          <div className="grid gap-4">
            {faqItems.map((item, index) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <Badge>{item.category}</Badge>
                      </div>
                      <h3 className="font-semibold mb-2">{item.question}</h3>
                      <p className="text-sm text-muted-foreground">{item.answer}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* HERO SECTION */}
        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Section Hero (Accueil)</CardTitle>
              <CardDescription>Modifiez la bannière principale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre principal</Label>
                <Input 
                  value={heroSection?.title || ""} 
                  placeholder="Titre accrocheur"
                />
              </div>
              <div className="space-y-2">
                <Label>Sous-titre</Label>
                <Textarea 
                  value={heroSection?.subtitle || ""} 
                  placeholder="Description"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Texte bouton CTA</Label>
                  <Input value={heroSection?.cta_text || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Lien CTA</Label>
                  <Input value={heroSection?.cta_link || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Image de fond URL</Label>
                <div className="flex gap-2">
                  <Input value={heroSection?.image_url || ""} />
                  <Button variant="outline" size="icon">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder les changements
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
