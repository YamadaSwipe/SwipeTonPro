'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  MessageSquare, 
  CreditCard,
  FileText,
  Hammer,
  Flag,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';
import { ProjetWorkflowService, ProjetDetails } from '@/services/projetWorkflowService';
import { chatService } from '@/services/chatService';
import { TarifService } from '@/services/tarifService';

interface ProjetDashboardProps {
  projetId: string;
  userId: string;
}

const ProjetDashboard: React.FC<ProjetDashboardProps> = ({ projetId, userId }) => {
  const [projet, setProjet] = useState<ProjetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [historique, setHistorique] = useState<any[]>([]);
  const [actionsDisponibles, setActionsDisponibles] = useState<any[]>([]);

  useEffect(() => {
    loadProjetData();
  }, [projetId]);

  const loadProjetData = async () => {
    try {
      setLoading(true);
      
      const [projetData, historiqueData, actions] = await Promise.all([
        ProjetWorkflowService.getProjetDetails(projetId),
        ProjetWorkflowService.getHistoriqueStatuts(projetId),
        projet ? ProjetWorkflowService.getActionsDisponibles(projet.statut) : []
      ]);

      setProjet(projetData);
      setHistorique(historiqueData);
      setActionsDisponibles(actions);
    } catch (error) {
      console.error('Erreur chargement données projet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      const result = await ProjetWorkflowService.updateStatut(projetId, action);
      
      if (result.success) {
        await loadProjetData(); // Recharger les données
      } else {
        console.error('Erreur action:', result.error);
      }
    } catch (error) {
      console.error('Erreur action:', error);
    }
  };

  const getStatutIcon = (statut: string) => {
    const icons: Record<string, React.ReactNode> = {
      'DEPOSE': <Clock className="w-4 h-4" />,
      'QUALIF': <AlertCircle className="w-4 h-4" />,
      'BADGE': <CheckCircle className="w-4 h-4" />,
      'VALID': <CheckCircle className="w-4 h-4" />,
      'LIGNE': <PlayCircle className="w-4 h-4" />,
      'CANDID': <Users className="w-4 h-4" />,
      'MATCH': <Users className="w-4 h-4" />,
      'PAIEMENT_ATTENTE': <CreditCard className="w-4 h-4" />,
      'PAIEMENT_ECHOUE': <AlertCircle className="w-4 h-4" />,
      'PAIEMENT_RETENTE': <PauseCircle className="w-4 h-4" />,
      'DEVIS': <FileText className="w-4 h-4" />,
      'DEVIS_VALIDE': <CheckCircle className="w-4 h-4" />,
      'TRAVAUX': <Hammer className="w-4 h-4" />,
      'FIN': <Flag className="w-4 h-4" />,
      'TERMINE': <StopCircle className="w-4 h-4" />
    };

    return icons[statut] || <Clock className="w-4 h-4" />;
  };

  const getProgression = () => {
    const statuts = ['DEPOSE', 'QUALIF', 'BADGE', 'VALID', 'LIGNE', 'CANDID', 'MATCH', 'PAIEMENT_ATTENTE', 'DEVIS', 'DEVIS_VALIDE', 'TRAVAUX', 'FIN', 'TERMINE'];
    const currentIndex = statuts.indexOf(projet?.statut || '');
    return ((currentIndex + 1) / statuts.length) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!projet) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Projet non trouvé</h3>
        <p className="text-gray-500">Le projet demandé n'existe pas ou n'est pas accessible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statut et progression */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{projet.titre}</h2>
              <p className="text-gray-600 mb-4">{projet.description}</p>
              
              <div className="flex items-center gap-4">
                <Badge className={ProjetWorkflowService.getStatutColor(projet.statut)}>
                  <div className="flex items-center gap-2">
                    {getStatutIcon(projet.statut)}
                    {ProjetWorkflowService.STATUTS[projet.statut]}
                  </div>
                </Badge>
                
                <div className="text-sm text-gray-500">
                  Mis à jour: {new Date(projet.updated_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression du projet</span>
              <span>{Math.round(getProgression())}%</span>
            </div>
            <Progress value={getProgression()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Actions disponibles */}
      {actionsDisponibles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {actionsDisponibles.map((action, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{action.label}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                  <Button 
                    onClick={() => handleAction(action.action)}
                    size="sm"
                  >
                    {action.label}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations sur les participants */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">{projet.client.full_name}</span>
              </div>
              <div className="text-sm text-gray-600">{projet.client.email}</div>
            </div>
          </CardContent>
        </Card>

        {projet.professional && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Professionnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">{projet.professional.full_name}</span>
                </div>
                <div className="text-sm text-gray-600">{projet.professional.email}</div>
                {projet.professional.company_name && (
                  <div className="text-sm text-gray-600">{projet.professional.company_name}</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Paiements et Devis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projet.paiements.length > 0 ? (
              <div className="space-y-3">
                {projet.paiements.map((paiement) => (
                  <div key={paiement.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">{TarifService.formatMontant(paiement.montant)}</span>
                      <div className="text-sm text-gray-600">
                        {new Date(paiement.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <Badge className={
                      paiement.statut === 'complete' ? 'bg-green-100 text-green-800' :
                      paiement.statut === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {paiement.statut === 'complete' ? 'Complet' :
                       paiement.statut === 'pending' ? 'En attente' : 'Échoué'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Aucun paiement pour ce projet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Devis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projet.devis.length > 0 ? (
              <div className="space-y-3">
                {projet.devis.map((devi) => (
                  <div key={devi.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <span className="font-medium">{TarifService.formatMontant(devi.montant)}</span>
                      <div className="text-sm text-gray-600">
                        {new Date(devi.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <Badge className={
                      devi.statut === 'valide' ? 'bg-green-100 text-green-800' :
                      devi.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {devi.statut === 'valide' ? 'Validé' :
                       devi.statut === 'en_attente' ? 'En attente' : 'Brouillon'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Aucun devis pour ce projet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Communication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChatSection projet={projet} userId={userId} />
        </CardContent>
      </Card>

      {/* Historique */}
      {historique.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historique des statuts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historique.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getStatutIcon(item.nouveau_statut)}
                    <div>
                      <span className="font-medium">
                        {ProjetWorkflowService.STATUTS[item.nouveau_statut]}
                      </span>
                      <div className="text-sm text-gray-600">
                        par {item.user?.full_name || 'Système'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(item.timestamp).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Composant ChatSection
const ChatSection: React.FC<{ projet: ProjetDetails; userId: string }> = ({ projet, userId }) => {
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (projet.professional_id) {
      loadConversation();
    }
  }, [projet]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const result = await chatService.getOrCreateConversation(projet.id, projet.professional_id!);
      setConversation(result.data);
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  if (!projet.professional_id) {
    return (
      <div className="text-center py-4 text-gray-500">
        Aucun professionnel sélectionné pour ce projet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversation ? (
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Conversation</h4>
            <Badge className={
              conversation.phase === 'active' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
            }>
              {conversation.phase === 'active' ? 'Chat complet' : 'Chat limité'}
            </Badge>
          </div>
          
          {conversation.phase === 'anonymous' && (
            <div className="bg-yellow-50 p-3 rounded mb-4">
              <p className="text-sm text-yellow-800">
                Chat limité : 3 messages maximum. 
                {conversation.client_message_count + conversation.pro_message_count >= 3 
                  ? ' Limite atteinte.' 
                  : ` ${3 - (conversation.client_message_count + conversation.pro_message_count)} message(s) restant(s).`
                }
              </p>
            </div>
          )}

          <Button className="w-full">
            <MessageSquare className="w-4 h-4 mr-2" />
            Ouvrir la conversation
          </Button>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          Aucune conversation active
        </div>
      )}
    </div>
  );
};

export default ProjetDashboard;
