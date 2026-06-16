import { SEO } from '@/components/SEO';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle, XCircle, Mail, Phone, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  request_type?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed' | 'spam';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  user_id?: string;
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const { toast } = useToast();

  useEffect(() => {
    loadTickets();
  }, [activeTab]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Erreur chargement tickets:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de charger les tickets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: '✅ Statut mis à jour',
        description: `Le ticket a été marqué comme "${getStatusLabel(status)}"`,
      });

      loadTickets();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_progress':
        return 'En cours';
      case 'resolved':
        return 'Résolu';
      case 'closed':
        return 'Fermé';
      case 'spam':
        return 'Spam';
      default:
        return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            En cours
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-3 h-3 mr-1" />
            Résolu
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="secondary">
            <CheckCircle className="w-3 h-3 mr-1" />
            Fermé
          </Badge>
        );
      case 'spam':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Spam
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;

    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Haute</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Moyenne</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Basse</Badge>;
      default:
        return null;
    }
  };

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  };

  return (
    <>
      <SEO title="Tickets de Support - Admin" />
      <AdminLayout title="Tickets de Support">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Mail className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En cours</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Résolus</p>
                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="pending">
                    En attente ({stats.pending})
                  </TabsTrigger>
                  <TabsTrigger value="in_progress">
                    En cours ({stats.in_progress})
                  </TabsTrigger>
                  <TabsTrigger value="resolved">
                    Résolus ({stats.resolved})
                  </TabsTrigger>
                  <TabsTrigger value="closed">Fermés</TabsTrigger>
                  <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4 mt-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Chargement...</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-semibold mb-2">Aucun ticket trouvé</p>
                      <p className="text-muted-foreground">
                        Aucun ticket ne correspond à ce filtre
                      </p>
                    </div>
                  ) : (
                    tickets.map((ticket) => (
                      <Card key={ticket.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            {/* En-tête */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                              {getStatusBadge(ticket.status)}
                              {ticket.request_type && (
                                <Badge variant="outline">{ticket.request_type}</Badge>
                              )}
                              {getPriorityBadge(ticket.priority)}
                            </div>

                            {/* Informations de contact */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="w-4 h-4" />
                                <span className="font-medium">{ticket.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <a
                                  href={`mailto:${ticket.email}`}
                                  className="hover:underline hover:text-primary"
                                >
                                  {ticket.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                <a
                                  href={`tel:${ticket.phone}`}
                                  className="hover:underline hover:text-primary"
                                >
                                  {ticket.phone}
                                </a>
                              </div>
                            </div>

                            {/* Message */}
                            <div className="bg-muted/50 p-3 rounded-md">
                              <p className="text-sm font-medium mb-1">Message:</p>
                              <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
                            </div>

                            {/* Métadonnées */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                Créé le {new Date(ticket.created_at).toLocaleString('fr-FR')}
                              </span>
                              {ticket.resolved_at && (
                                <span>
                                  Résolu le {new Date(ticket.resolved_at).toLocaleString('fr-FR')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            {ticket.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                                className="w-full"
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Prendre en charge
                              </Button>
                            )}
                            {ticket.status === 'in_progress' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 w-full"
                                onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Résoudre
                              </Button>
                            )}
                            {ticket.status === 'resolved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTicketStatus(ticket.id, 'closed')}
                                className="w-full"
                              >
                                Fermer
                              </Button>
                            )}
                            {ticket.status !== 'spam' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateTicketStatus(ticket.id, 'spam')}
                                className="w-full"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Spam
                              </Button>
                            )}
                            {ticket.status === 'spam' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTicketStatus(ticket.id, 'pending')}
                                className="w-full"
                              >
                                Restaurer
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
}
