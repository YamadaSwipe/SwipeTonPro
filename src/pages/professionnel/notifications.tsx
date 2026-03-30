import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Link from "next/link";

export default function NotificationsPage() {
  return (
    <ProtectedRoute allowedRoles={["professional"]}>
      <SEO title="Notifications - SwipeTonPro" />
      <div className="min-h-screen bg-gray-50 py-8">
        <header className="border-b border-border bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/professionnel/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Centre de Notifications</h1>
            <p className="text-text-secondary">
              Toutes vos notifications importantes en un seul endroit
            </p>
          </div>

          <NotificationCenter />
        </main>
      </div>
    </ProtectedRoute>
  );
}