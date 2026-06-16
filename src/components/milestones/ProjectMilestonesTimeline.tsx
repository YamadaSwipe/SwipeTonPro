/**
 * @fileoverview Composant Timeline des jalons de projet
 * @description Affichage visuel de l'avancement du projet avec validation collaborative
 * @author Senior Architect
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  DollarSign,
  Lock,
} from 'lucide-react';
import {
  projectMilestonesService,
  type ProjectMilestone,
  type MilestoneType,
  MILESTONE_LABELS,
  MILESTONE_DESCRIPTIONS,
  STATUS_LABELS,
} from '@/services/projectMilestonesService';
import { useAuth } from '@/context/AuthContext';

interface ProjectMilestonesTimelineProps {
  projectId: string;
  projectClientId: string;
  professionalUserId?: string;
  escrowEnabled?: boolean;
  onMilestoneUpdate?: () => void;
}

export function ProjectMilestonesTimeline({
  projectId,
  projectClientId,
  professionalUserId,
  escrowEnabled = false,
  onMilestoneUpdate,
}: ProjectMilestonesTimelineProps) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // États pour les modales
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedMilestoneType, setSelectedMilestoneType] = useState<MilestoneType | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<ProjectMilestone | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [releasingFunds, setReleasingFunds] = useState(false);

  // Charger les jalons
  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await projectMilestonesService.getProjectMilestones(projectId);

      if (err) {
        setError('Erreur lors du chargement des jalons');
        console.error(err);
        return;
      }

      if (data) {
        setMilestones(data);
        const calculatedProgress = projectMilestonesService.calculateProgress(data);
        setProgress(calculatedProgress);
      }
    } catch (err) {
      console.error('Erreur chargement jalons:', err);
      setError('Erreur lors du chargement des jalons');
    } finally {
      setLoading(false);
    }
  };

  const handleProposeMilestone = async () => {
    if (!user || !selectedMilestoneType) return;

    try {
      setSubmitting(true);

      const { data, error: err } = await projectMilestonesService.proposeMilestone({
        projectId,
        milestoneType: selectedMilestoneType,
        proposedBy: user.id,
        comment: comment || undefined,
      });

      if (err || !data?.success) {
        alert(data?.error || 'Erreur lors de la proposition du jalon');
        return;
      }

      // Recharger les jalons
      await loadMilestones();
      setShowProposeModal(false);
      setComment('');
      setSelectedMilestoneType(null);

      if (onMilestoneUpdate) {
        onMilestoneUpdate();
      }
    } catch (err) {
      console.error('Erreur proposition jalon:', err);
      alert('Erreur lors de la proposition du jalon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateMilestone = async (action: 'validate' | 'reject') => {
    if (!user || !selectedMilestone) return;

    try {
      setSubmitting(true);

      const { data, error: err } = await projectMilestonesService.validateMilestone({
        milestoneId: selectedMilestone.id,
        validatedBy: user.id,
        comment: comment || undefined,
        action,
      });

      if (err || !data?.success) {
        alert(data?.error || 'Erreur lors de la validation du jalon');
        return;
      }

      // Recharger les jalons
      await loadMilestones();
      setShowValidateModal(false);
      setComment('');
      setSelectedMilestone(null);

      if (onMilestoneUpdate) {
        onMilestoneUpdate();
      }
    } catch (err) {
      console.error('Erreur validation jalon:', err);
      alert('Erreur lors de la validation du jalon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseFunds = async () => {
    if (!user || !selectedMilestone) return;

    try {
      setReleasingFunds(true);

      const response = await fetch('/api/release-milestone-funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          milestoneId: selectedMilestone.id,
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.error || 'Erreur lors du déblocage des fonds');
        return;
      }

      alert(`✅ ${result.data.amountReleased}€ ont été transférés à l'artisan avec succès !`);

      // Recharger les jalons
      await loadMilestones();
      setShowReleaseModal(false);
      setSelectedMilestone(null);

      if (onMilestoneUpdate) {
        onMilestoneUpdate();
      }
    } catch (err) {
      console.error('Erreur déblocage fonds:', err);
      alert('Erreur lors du déblocage des fonds');
    } finally {
      setReleasingFunds(false);
    }
  };

  const openProposeModal = (type: MilestoneType) => {
    setSelectedMilestoneType(type);
    setComment('');
    setShowProposeModal(true);
  };

  const openValidateModal = (milestone: ProjectMilestone) => {
    setSelectedMilestone(milestone);
    setComment('');
    setShowValidateModal(true);
  };

  const openReleaseModal = (milestone: ProjectMilestone) => {
    setSelectedMilestone(milestone);
    setShowReleaseModal(true);
  };

  const canPropose = user && projectMilestonesService.canProposeMilestone(
    user.id,
    projectClientId,
    professionalUserId
  );

  const canValidate = (milestone: ProjectMilestone) => {
    return user && projectMilestonesService.canValidateMilestone(
      user.id,
      milestone,
      projectClientId,
      professionalUserId
    );
  };

  const getMilestoneStatus = (type: MilestoneType): ProjectMilestone | undefined => {
    return milestones.find((m) => m.milestone_type === type);
  };

  const allMilestoneTypes: MilestoneType[] = [
    'quote_accepted',
    'work_started',
    'progress_30',
    'progress_60',
    'work_completed',
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des jalons...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Suivi de l'avancement du projet</span>
            <Badge variant="outline" className="text-lg px-4 py-1">
              {progress}% complété
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Barre de progression */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timeline des jalons */}
          <div className="space-y-6">
            {allMilestoneTypes.map((type, index) => {
              const milestone = getMilestoneStatus(type);
              const isValidated = milestone?.validation_status === 'validated';
              const isPending = milestone?.validation_status === 'pending_validation';
              const isRejected = milestone?.validation_status === 'rejected';

              return (
                <div key={type} className="relative">
                  {/* Ligne de connexion */}
                  {index < allMilestoneTypes.length - 1 && (
                    <div
                      className={`absolute left-6 top-12 w-0.5 h-full ${
                        isValidated ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}

                  <div className="flex items-start space-x-4">
                    {/* Icône du jalon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        isValidated
                          ? 'bg-green-100 border-2 border-green-500'
                          : isPending
                          ? 'bg-yellow-100 border-2 border-yellow-500'
                          : isRejected
                          ? 'bg-red-100 border-2 border-red-500'
                          : 'bg-gray-100 border-2 border-gray-300'
                      }`}
                    >
                      {isValidated ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : isPending ? (
                        <Clock className="h-6 w-6 text-yellow-600" />
                      ) : isRejected ? (
                        <XCircle className="h-6 w-6 text-red-600" />
                      ) : (
                        <span className="text-gray-400">
                          {projectMilestonesService.getMilestoneIcon(type)}
                        </span>
                      )}
                    </div>

                    {/* Contenu du jalon */}
                    <div className="flex-1">
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg">{MILESTONE_LABELS[type]}</h3>
                            <p className="text-sm text-gray-600">{MILESTONE_DESCRIPTIONS[type]}</p>
                          </div>
                          {milestone && (
                            <Badge
                              className={projectMilestonesService.getStatusColor(
                                milestone.validation_status
                              )}
                            >
                              {STATUS_LABELS[milestone.validation_status]}
                            </Badge>
                          )}
                        </div>

                        {/* Informations du jalon */}
                        {milestone && (
                          <div className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <User className="h-4 w-4 mr-2" />
                              <span>
                                Proposé par {milestone.proposed_by_name || 'Utilisateur'} (
                                {milestone.proposed_by_role === 'client' ? 'Client' : 'Artisan'})
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>
                                {projectMilestonesService.formatDate(milestone.proposed_at)}
                              </span>
                            </div>
                            {milestone.proposed_comment && (
                              <div className="flex items-start text-gray-600">
                                <MessageSquare className="h-4 w-4 mr-2 mt-0.5" />
                                <span className="italic">{milestone.proposed_comment}</span>
                              </div>
                            )}
                            {milestone.validated_by && (
                              <>
                                <div className="flex items-center text-gray-600">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  <span>
                                    Validé par {milestone.validated_by_name || 'Utilisateur'} (
                                    {milestone.validated_by_role === 'client'
                                      ? 'Client'
                                      : 'Artisan'}
                                    )
                                  </span>
                                </div>
                                {milestone.validation_comment && (
                                  <div className="flex items-start text-gray-600">
                                    <MessageSquare className="h-4 w-4 mr-2 mt-0.5" />
                                    <span className="italic">{milestone.validation_comment}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex gap-2 flex-wrap">
                          {!milestone && canPropose && (
                            <Button
                              size="sm"
                              onClick={() => openProposeModal(type)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Proposer ce jalon
                            </Button>
                          )}
                          {milestone && isPending && canValidate(milestone) && (
                            <Button
                              size="sm"
                              onClick={() => openValidateModal(milestone)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Valider / Rejeter
                            </Button>
                          )}
                          {milestone && (isPending || isRejected) && canPropose && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openProposeModal(type)}
                            >
                              Modifier
                            </Button>
                          )}
                          {/* Bouton de déblocage des fonds (séquestre) */}
                          {escrowEnabled &&
                            milestone &&
                            isValidated &&
                            (milestone as any).payment_status === 'ready_to_release' &&
                            user?.id === projectClientId && (
                              <Button
                                size="sm"
                                onClick={() => openReleaseModal(milestone)}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg"
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Débloquer les fonds ({(milestone as any).payment_amount}€)
                              </Button>
                            )}
                          {/* Indicateur de fonds débloqués */}
                          {escrowEnabled &&
                            milestone &&
                            (milestone as any).payment_status === 'released' && (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Fonds débloqués ({(milestone as any).payment_amount}€)
                              </Badge>
                            )}
                          {/* Indicateur de fonds en séquestre */}
                          {escrowEnabled &&
                            milestone &&
                            isValidated &&
                            (milestone as any).payment_status === 'pending' && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                <Lock className="h-3 w-3 mr-1" />
                                Fonds en séquestre ({(milestone as any).payment_amount}€)
                              </Badge>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de proposition */}
      <Dialog open={showProposeModal} onOpenChange={setShowProposeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Proposer le jalon : {selectedMilestoneType && MILESTONE_LABELS[selectedMilestoneType]}
            </DialogTitle>
            <DialogDescription>
              {selectedMilestoneType && MILESTONE_DESCRIPTIONS[selectedMilestoneType]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Commentaire (optionnel)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ajoutez un commentaire pour expliquer ce jalon..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProposeModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleProposeMilestone}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Envoi...' : 'Proposer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de validation */}
      <Dialog open={showValidateModal} onOpenChange={setShowValidateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Valider le jalon :{' '}
              {selectedMilestone && MILESTONE_LABELS[selectedMilestone.milestone_type]}
            </DialogTitle>
            <DialogDescription>
              Proposé par {selectedMilestone?.proposed_by_name || 'Utilisateur'}
              {selectedMilestone?.proposed_comment && (
                <div className="mt-2 p-2 bg-gray-100 rounded italic text-sm">
                  "{selectedMilestone.proposed_comment}"
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Commentaire (optionnel)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ajoutez un commentaire..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowValidateModal(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleValidateMilestone('reject')}
              disabled={submitting}
            >
              {submitting ? 'Envoi...' : 'Rejeter'}
            </Button>
            <Button
              onClick={() => handleValidateMilestone('validate')}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Envoi...' : 'Valider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de déblocage des fonds */}
      <Dialog open={showReleaseModal} onOpenChange={setShowReleaseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <DollarSign className="h-6 w-6 mr-2 text-green-600" />
              Débloquer les fonds du jalon
            </DialogTitle>
            <DialogDescription>
              {selectedMilestone && MILESTONE_LABELS[selectedMilestone.milestone_type]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                ℹ️ Informations sur le déblocage
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Montant à débloquer :{' '}
                  <strong>{(selectedMilestone as any)?.payment_amount}€</strong>
                </li>
                <li>• Les fonds seront transférés directement à l'artisan</li>
                <li>• Cette action est irréversible</li>
                <li>• Un reçu sera envoyé par email</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Attention</h4>
              <p className="text-sm text-yellow-800">
                Assurez-vous que les travaux correspondant à ce jalon ont bien été réalisés
                avant de débloquer les fonds. Une fois débloqués, les fonds ne pourront plus
                être récupérés.
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowReleaseModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleReleaseFunds}
              disabled={releasingFunds}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {releasingFunds ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Déblocage en cours...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Confirmer le déblocage
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
