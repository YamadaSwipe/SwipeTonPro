import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle, XCircle, Clock, MapPin, Euro, Calendar,
  RefreshCw, Eye, AlertCircle, MessageSquare, ChevronDown,
  ChevronUp, User, Loader2
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectStatus = "pending" | "published" | "rejected" | "info_needed" | "draft" | "in_progress" | "completed" | "cancelled";
type ActiveTab = "pending" | "info_needed" | "published" | "rejected" | "all";

interface Project {
  id: string;
  title: string;
  description: string;
  city: string;
  postal_code?: string;
  budget_min?: number;
  budget_max?: number;
  work_type?: string;
  category?: string;
  urgency?: string;
  status: string;
  created_at: string;
  client_id: string;
  rejection_reason?: string;
  info_needed_message?: string;
  client?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

const TAB_CONFIG: { key: ActiveTab; label: string; color: string }[] = [
  { key: "pending",     label: "En attente",        color: "text-amber-400 border-amber-400" },
  { key: "info_needed", label: "Infos demandées",   color: "text-blue-400 border-blue-400" },
  { key: "published",   label: "Validés",            color: "text-emerald-400 border-emerald-400" },
  { key: "rejected",    label: "Refusés",            color: "text-red-400 border-red-400" },
  { key: "all",         label: "Tous",               color: "text-gray-400 border-gray-500" },
];

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // État des modales de saisie
  const [rejectModal, setRejectModal] = useState<{ id: string; clientEmail?: string; title: string } | null>(null);
  const [infoModal, setInfoModal]   = useState<{ id: string; clientEmail?: string; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [infoMessage, setInfoMessage]   = useState("");

  // ── Chargement des données ──────────────────────────────────────────────

  const loadProjects = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      console.log("🔍 Chargement tous les projets admin...");
      
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          client:profiles!projects_client_id_fkey(full_name, email, phone)
        `)
        .order("created_at", { ascending: false });

      console.log("📊 Résultat projets admin:", { data: data?.length || 0, error });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error("❌ Erreur chargement projets:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // ── Filtrage ────────────────────────────────────────────────────────────

  const filtered = projects.filter(p => {
    if (activeTab === "all") return true;
    if (activeTab === "published") return p.status === "published";
    if (activeTab === "rejected")  return p.status === "rejected";
    if (activeTab === "info_needed") return p.status === "info_needed";
    return p.status === "pending";
  });

  const counts = {
    pending:     projects.filter(p => p.status === "pending").length,
    info_needed: projects.filter(p => p.status === "info_needed").length,
    published:   projects.filter(p => p.status === "published").length,
    rejected:    projects.filter(p => p.status === "rejected").length,
    all:         projects.length,
  };

  // ── Actions ─────────────────────────────────────────────────────────────

  const updateStatus = async (
    projectId: string,
    status: ProjectStatus,
    extra?: { rejection_reason?: string; info_needed_message?: string }
  ) => {
    setActionLoading(projectId);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          status: status as any,
          validation_status: status,
          ...extra,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (error) throw error;

      // Notifier le client
      await fetch("/api/notify-project-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          action: status === "published" ? "validate"
                : status === "rejected"  ? "reject"
                : "info_needed",
          reason: extra?.rejection_reason || extra?.info_needed_message,
          validatedBy: "Admin",
        }),
      });

      await loadProjects(true);
    } catch (err) {
      console.error("Erreur action:", err);
      alert("Une erreur est survenue");
    } finally {
      setActionLoading(null);
    }
  };

  const handleValidate = (project: Project) => {
    if (!window.confirm(`Valider "${project.title}" ?`)) return;
    updateStatus(project.id, "published");
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    updateStatus(rejectModal!.id, "rejected", { rejection_reason: rejectReason });
    setRejectModal(null);
    setRejectReason("");
  };

  const handleInfoNeeded = () => {
    if (!infoMessage.trim()) return;
    updateStatus(infoModal!.id, "info_needed", { info_needed_message: infoMessage });
    setInfoModal(null);
    setInfoMessage("");
  };

  // ── Helpers UI ──────────────────────────────────────────────────────────

  const statusBadge = (status: string) => {
    switch (status) {
      case "published":   return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Validé</span>;
      case "pending":     return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">En attente</span>;
      case "rejected":    return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">Refusé</span>;
      case "info_needed": return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">Infos demandées</span>;
      default:            return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/30">{status}</span>;
    }
  };

  const budget = (p: Project) => {
    if (!p.budget_min && !p.budget_max) return "Non renseigné";
    if (p.budget_min && p.budget_max) return `${p.budget_min.toLocaleString("fr-FR")}€ — ${p.budget_max.toLocaleString("fr-FR")}€`;
    return `${(p.budget_min || p.budget_max || 0).toLocaleString("fr-FR")}€`;
  };

  // ── Rendu ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  return (
    <>
      <SEO title="Projets — Admin SwipeTonPro" />
      <div className="min-h-screen bg-gray-950 text-white">

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-white/8">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                ← Dashboard
              </Link>
              <span className="text-gray-600">/</span>
              <h1 className="font-semibold text-white text-sm">Projets</h1>
              {counts.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">
                  {counts.pending} en attente
                </span>
              )}
            </div>
            <button
              onClick={() => loadProjects(true)}
              disabled={refreshing}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-all"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

          {/* ── TABS ── */}
          <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-white/8 overflow-x-auto">
            {TAB_CONFIG.map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === key
                    ? "bg-white/10 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {label}
                <span className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full bg-white/5 ${
                  activeTab === key ? color.split(" ")[0] : "text-gray-600"
                }`}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>

          {/* ── LISTE ── */}
          {filtered.length === 0 ? (
            <div className="bg-gray-900 border border-white/8 rounded-xl py-16 text-center">
              <CheckCircle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {activeTab === "pending" ? "Aucun projet en attente 🎉" : "Aucun projet dans cette catégorie"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(project => {
                const isExpanded = expandedId === project.id;
                const isActioning = actionLoading === project.id;

                return (
                  <div key={project.id}
                    className="bg-gray-900 border border-white/8 rounded-xl overflow-hidden hover:border-white/15 transition-colors">

                    {/* ── Ligne principale ── */}
                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Indicateur statut */}
                      <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
                        project.status === "pending"     ? "bg-amber-400" :
                        project.status === "info_needed" ? "bg-blue-400" :
                        project.status === "published"   ? "bg-emerald-400" :
                        "bg-red-400"
                      }`} />

                      {/* Infos principales */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-white text-sm truncate">{project.title}</p>
                          {statusBadge(project.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {project.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{project.city}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Euro className="h-3 w-3" />{budget(project)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(project.created_at).toLocaleDateString("fr-FR")}
                          </span>
                          {project.client?.email && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />{project.client.full_name || project.client.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions rapides — seulement pour pending */}
                      {project.status === "pending" && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleValidate(project)}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-xs font-medium disabled:opacity-50"
                          >
                            {isActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                            Valider
                          </button>
                          <button
                            onClick={() => setInfoModal({ id: project.id, clientEmail: project.client?.email, title: project.title })}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-all text-xs font-medium disabled:opacity-50"
                          >
                            <MessageSquare className="h-3 w-3" />
                            Infos
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: project.id, clientEmail: project.client?.email, title: project.title })}
                            disabled={isActioning}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all text-xs font-medium disabled:opacity-50"
                          >
                            <XCircle className="h-3 w-3" />
                            Refuser
                          </button>
                        </div>
                      )}

                      {/* Bouton expand */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : project.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all flex-shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* ── Détails expandés ── */}
                    {isExpanded && (
                      <div className="border-t border-white/8 px-5 py-4 space-y-4 bg-gray-900/50">
                        {/* Description */}
                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Description</p>
                          <p className="text-sm text-gray-300 leading-relaxed">{project.description || "Aucune description"}</p>
                        </div>

                        {/* Détails */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {project.work_type && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Type de travaux</p>
                              <p className="text-sm text-white">{project.work_type}</p>
                            </div>
                          )}
                          {project.urgency && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Urgence</p>
                              <p className="text-sm text-white">{project.urgency}</p>
                            </div>
                          )}
                          {project.postal_code && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Code postal</p>
                              <p className="text-sm text-white">{project.postal_code}</p>
                            </div>
                          )}
                          {project.client?.phone && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Téléphone client</p>
                              <p className="text-sm text-white">{project.client.phone}</p>
                            </div>
                          )}
                        </div>

                        {/* Contact client */}
                        {project.client && (
                          <div className="bg-white/4 rounded-lg p-3 flex items-center gap-3">
                            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="text-sm">
                              <span className="text-white font-medium">{project.client.full_name || "Client"}</span>
                              <span className="text-gray-400 ml-2">{project.client.email}</span>
                            </div>
                          </div>
                        )}

                        {/* Motif affiché si refusé ou infos demandées */}
                        {project.status === "rejected" && project.rejection_reason && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-400 mb-1">Motif du refus</p>
                            <p className="text-sm text-red-300">{project.rejection_reason}</p>
                          </div>
                        )}
                        {project.status === "info_needed" && project.info_needed_message && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-400 mb-1">Message envoyé au client</p>
                            <p className="text-sm text-blue-300">{project.info_needed_message}</p>
                          </div>
                        )}

                        {/* Actions secondaires (hors pending) */}
                        {project.status !== "pending" && (
                          <div className="flex gap-2 pt-2">
                            {project.status === "info_needed" && (
                              <button
                                onClick={() => handleValidate(project)}
                                disabled={isActioning}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-xs font-medium"
                              >
                                <CheckCircle className="h-3 w-3" /> Valider quand même
                              </button>
                            )}
                            {(project.status === "info_needed" || project.status === "published") && (
                              <button
                                onClick={() => setRejectModal({ id: project.id, clientEmail: project.client?.email, title: project.title })}
                                disabled={isActioning}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-all text-xs font-medium"
                              >
                                <XCircle className="h-3 w-3" /> Refuser
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── MODALE REFUS ── */}
        {rejectModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/15 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Refuser le projet</h3>
                  <p className="text-xs text-gray-400 truncate max-w-56">{rejectModal.title}</p>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-300 mb-2">
                Motif du refus <span className="text-red-400">*</span>
              </label>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Expliquez pourquoi ce projet est refusé... Ce message sera envoyé au client."
                rows={4}
                className="bg-gray-800 border-white/10 text-white placeholder:text-gray-500 resize-none mb-4"
                autoFocus
              />
              {rejectModal.clientEmail && (
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" />
                  Email envoyé à : {rejectModal.clientEmail}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectModal(null); setRejectReason(""); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/8 transition-all text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading === rejectModal.id}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all text-sm font-medium disabled:opacity-40"
                >
                  {actionLoading === rejectModal.id ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Refuser et notifier"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODALE INFOS DEMANDÉES ── */}
        {infoModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/15 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Demander des informations</h3>
                  <p className="text-xs text-gray-400 truncate max-w-56">{infoModal.title}</p>
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message au client <span className="text-red-400">*</span>
              </label>
              <Textarea
                value={infoMessage}
                onChange={e => setInfoMessage(e.target.value)}
                placeholder="Précisez les informations manquantes... Le client recevra ce message par email et pourra compléter son projet."
                rows={4}
                className="bg-gray-800 border-white/10 text-white placeholder:text-gray-500 resize-none mb-4"
                autoFocus
              />
              {infoModal.clientEmail && (
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" />
                  Email envoyé à : {infoModal.clientEmail}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setInfoModal(null); setInfoMessage(""); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/8 transition-all text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleInfoNeeded}
                  disabled={!infoMessage.trim() || actionLoading === infoModal.id}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm font-medium disabled:opacity-40"
                >
                  {actionLoading === infoModal.id ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Envoyer au client"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
