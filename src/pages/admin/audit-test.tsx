import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Users, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  CreditCard, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download
} from "lucide-react";

export default function AuditTestPage() {
  const [currentStep, setCurrentStep] = useState("idle");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const runTest = async (action: string) => {
    setLoading(true);
    setCurrentStep(action);
    addLog(`🚀 Début du test: ${action}`);

    try {
      const response = await fetch("/api/test/complete-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
        addLog(`✅ Test ${action} terminé avec succès`);
        addLog(`📊 Résultats: ${JSON.stringify(data.results || data.message)}`);
      } else {
        addLog(`❌ Erreur test ${action}: ${data.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Erreur test ${action}: ${error.message}`);
    } finally {
      setLoading(false);
      setCurrentStep("idle");
    }
  };

  const runCompleteTest = async () => {
    setLoading(true);
    setCurrentStep("complete");
    addLog("🚀 DÉMARRAGE DU TEST COMPLET A-Z");
    addLog("================================");

    try {
      const response = await fetch("/api/test/complete-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_complete_test" })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
        addLog("✅ TEST COMPLET TERMINÉ AVEC SUCCÈS !");
        addLog("================================");
        addLog(`📊 Résultats complets: ${JSON.stringify(data.results, null, 2)}`);
      } else {
        addLog(`❌ Erreur test complet: ${data.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Erreur test complet: ${error.message}`);
    } finally {
      setLoading(false);
      setCurrentStep("idle");
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setResults(null);
  };

  const downloadResults = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = "data:application/json;charset=utf-8,"+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `audit-test-results-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const testSteps = [
    {
      id: "create_professionals",
      title: "Création Comptes Pros",
      description: "Créer 3 comptes professionnels test",
      icon: Briefcase,
      color: "bg-blue-500"
    },
    {
      id: "create_clients", 
      title: "Création Comptes Clients",
      description: "Créer 3 comptes clients test",
      icon: Users,
      color: "bg-green-500"
    },
    {
      id: "create_projects",
      title: "Création Projets",
      description: "Créer 3 projets test",
      icon: FileText,
      color: "bg-purple-500"
    },
    {
      id: "simulate_matching",
      title: "Simulation Matching",
      description: "Simuler les postulations et intérêts",
      icon: CheckCircle,
      color: "bg-yellow-500"
    },
    {
      id: "simulate_dialogue",
      title: "Simulation Dialogue",
      description: "Simuler les conversations pré-match",
      icon: MessageSquare,
      color: "bg-indigo-500"
    },
    {
      id: "simulate_payment",
      title: "Simulation Paiement",
      description: "Simuler les paiements Stripe",
      icon: CreditCard,
      color: "bg-red-500"
    },
    {
      id: "simulate_planning",
      title: "Simulation Planning",
      description: "Simuler les événements planning",
      icon: Calendar,
      color: "bg-orange-500"
    },
    {
      id: "validate_admin",
      title: "Validation Admin",
      description: "Simuler validation par admin",
      icon: CheckCircle,
      color: "bg-teal-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Audit Complet <span className="gradient-primary bg-clip-text text-transparent">SwipeTonPro</span>
          </h1>
          <p className="text-text-secondary text-lg">
            Simulation A-Z de toutes les fonctionnalités de la plateforme
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Panneau de contrôle */}
          <div className="lg:col-span-1 space-y-6">
            {/* Test complet */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Test Complet A-Z
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-text-secondary">
                  Lancez le test complet qui simule toutes les fonctionnalités de la plateforme.
                </p>
                <Button 
                  onClick={runCompleteTest}
                  disabled={loading}
                  className="w-full gradient-primary text-white"
                  size="lg"
                >
                  {loading ? "Test en cours..." : "Lancer Test Complet"}
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={clearLogs}
                    className="flex-1"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Effacer
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={downloadResults}
                    disabled={!results}
                    className="flex-1"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tests individuels */}
            <Card>
              <CardHeader>
                <CardTitle>Tests Individuels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testSteps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center`}>
                          <step.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{step.title}</p>
                          <p className="text-xs text-text-secondary">{step.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runTest(step.id)}
                        disabled={loading}
                      >
                        Tester
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statut */}
            <Card>
              <CardHeader>
                <CardTitle>Statut du Test</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">État actuel:</span>
                    <Badge variant={currentStep === "idle" ? "secondary" : "default"}>
                      {currentStep === "idle" ? "En attente" : currentStep}
                    </Badge>
                  </div>
                  {results && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Tests exécutés:</span>
                        <span className="text-sm font-medium">{Object.keys(results).length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Statut global:</span>
                        <Badge variant="default">
                          {results.message?.includes("succès") ? "✅ Succès" : "⚠️ Erreurs"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logs et résultats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logs */}
            <Card>
              <CardHeader>
                <CardTitle>Logs du Test</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black/50 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-gray-400">Aucun log disponible. Lancez un test pour voir les logs.</p>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="mb-1">{log}</div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Résultats détaillés */}
            {results && (
              <Card>
                <CardHeader>
                  <CardTitle>Résultats Détaillés</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="summary">Résumé</TabsTrigger>
                      <TabsTrigger value="professionals">Pros</TabsTrigger>
                      <TabsTrigger value="clients">Clients</TabsTrigger>
                      <TabsTrigger value="projects">Projets</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="summary" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900">Professionnels</h4>
                          <p className="text-2xl font-bold text-blue-600">
                            {results.results?.professionals?.results?.filter((r: any) => r.success)?.length || 0}
                          </p>
                          <p className="text-sm text-blue-700">créés avec succès</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium text-green-900">Clients</h4>
                          <p className="text-2xl font-bold text-green-600">
                            {results.results?.clients?.results?.filter((r: any) => r.success)?.length || 0}
                          </p>
                          <p className="text-sm text-green-700">créés avec succès</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-medium text-purple-900">Projets</h4>
                          <p className="text-2xl font-bold text-purple-600">
                            {results.results?.projects?.results?.filter((r: any) => r.success)?.length || 0}
                          </p>
                          <p className="text-sm text-purple-700">créés avec succès</p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <h4 className="font-medium text-yellow-900">Matchings</h4>
                          <p className="text-2xl font-bold text-yellow-600">
                            {results.results?.matching?.results?.filter((r: any) => r.success)?.length || 0}
                          </p>
                          <p className="text-sm text-yellow-700">simulés avec succès</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="professionals" className="space-y-4">
                      {results.results?.professionals?.results?.map((pro: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{pro.email}</h4>
                            <Badge variant={pro.success ? "default" : "destructive"}>
                              {pro.success ? "✅ Succès" : "❌ Erreur"}
                            </Badge>
                          </div>
                          {pro.error && (
                            <p className="text-sm text-red-600">Erreur: {pro.error}</p>
                          )}
                        </div>
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="clients" className="space-y-4">
                      {results.results?.clients?.results?.map((client: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{client.email}</h4>
                            <Badge variant={client.success ? "default" : "destructive"}>
                              {client.success ? "✅ Succès" : "❌ Erreur"}
                            </Badge>
                          </div>
                          {client.error && (
                            <p className="text-sm text-red-600">Erreur: {client.error}</p>
                          )}
                        </div>
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="projects" className="space-y-4">
                      {results.results?.projects?.results?.map((project: any, index: number) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{project.title}</h4>
                            <Badge variant={project.success ? "default" : "destructive"}>
                              {project.success ? "✅ Succès" : "❌ Erreur"}
                            </Badge>
                          </div>
                          {project.error && (
                            <p className="text-sm text-red-600">Erreur: {project.error}</p>
                          )}
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
