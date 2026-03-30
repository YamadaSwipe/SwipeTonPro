'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Shield, 
  Smartphone, 
  Key, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorAuthProps {
  userId: string;
  onSetupComplete?: () => void;
}

export default function TwoFactorAuth({ userId, onSetupComplete }: TwoFactorAuthProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<'check' | 'setup' | 'verify'>('check');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkTwoFactorStatus();
  }, [userId]);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEnabled(data.enabled);
        setSetupStep(data.enabled ? 'check' : 'setup');
      }
    } catch (error) {
      console.error('Erreur vérification 2FA:', error);
    }
  };

  const enableTwoFactor = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes);
        setSetupStep('verify');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Veuillez entrer un code à 6 chiffres",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          token: verificationCode,
          secret
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEnabled(true);
        setSetupStep('check');
        toast({
          title: "✅ 2FA activé !",
          description: "L'authentification à deux facteurs est maintenant activée",
        });
        onSetupComplete?.();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erreur de vérification",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEnabled(false);
        setSetupStep('setup');
        setQrCode('');
        setSecret('');
        setBackupCodes([]);
        toast({
          title: "2FA désactivé",
          description: "L'authentification à deux facteurs a été désactivée",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (setupStep === 'check') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Authentification à Deux Facteurs
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className={`p-4 rounded-lg ${isEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              <div>
                <h3 className="font-semibold">
                  {isEnabled ? '2FA Activé' : '2FA Désactivé'}
                </h3>
                <p className="text-sm text-gray-600">
                  {isEnabled 
                    ? 'Votre compte est protégé par l\'authentification à deux facteurs'
                    : 'Votre compte n\'est pas protégé par l\'authentification à deux facteurs'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Pourquoi activer la 2FA ?</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Protection renforcée contre les accès non autorisés</li>
                <li>• Sécurité supplémentaire même si votre mot de passe est compromis</li>
                <li>• Tranquillité d'esprit pour vos données sensibles</li>
                <li>• Conformité avec les standards de sécurité modernes</li>
              </ul>
            </div>

            <div className="flex gap-3">
              {!isEnabled ? (
                <Button
                  onClick={enableTwoFactor}
                  disabled={loading}
                  className="flex-1"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {loading ? 'Activation...' : 'Activer la 2FA'}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={disableTwoFactor}
                  disabled={loading}
                  className="flex-1"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {loading ? 'Désactivation...' : 'Désactiver la 2FA'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (setupStep === 'setup') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Configuration de l'Authentification à Deux Facteurs
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important :</strong> Avant de continuer, assurez-vous d'avoir une application d'authentification 
              comme Google Authenticator, Authy, ou Microsoft Authenticator installée sur votre smartphone.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold">Étapes de configuration :</h3>
            <ol className="space-y-2 text-sm">
              <li>1. Cliquez sur "Générer le QR Code"</li>
              <li>2. Scannez le QR Code avec votre application d'authentification</li>
              <li>3. Entrez le code à 6 chiffres généré</li>
              <li>4. Sauvegardez vos codes de récupération</li>
            </ol>
          </div>

          <Button
            onClick={enableTwoFactor}
            disabled={loading}
            className="w-full"
          >
            <Key className="w-4 h-4 mr-2" />
            {loading ? 'Génération...' : 'Générer le QR Code'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (setupStep === 'verify') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Vérification de l'Authentification à Deux Facteurs
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR Code */}
            <div className="space-y-4">
              <h3 className="font-semibold">Scannez ce QR Code</h3>
              <div className="flex justify-center p-4 bg-white border rounded-lg">
                {qrCode && <QRCodeSVG value={qrCode} size={200} />}
              </div>
              <p className="text-sm text-gray-600 text-center">
                Utilisez votre application d'authentification
              </p>
            </div>

            {/* Secret Key */}
            <div className="space-y-4">
              <h3 className="font-semibold">Ou entrez cette clé manuellement</h3>
              <div className="relative">
                <Input
                  type={showSecret ? 'text' : 'password'}
                  value={secret}
                  readOnly
                  className="pr-20"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(secret)}
                  >
                    {copiedSecret ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {copiedSecret && (
                <p className="text-sm text-green-600">Clé copiée !</p>
              )}
            </div>
          </div>

          {/* Verification Code */}
          <div className="space-y-4">
            <Label htmlFor="verification-code">Code de vérification à 6 chiffres</Label>
            <Input
              id="verification-code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
            />
          </div>

          {/* Backup Codes */}
          {backupCodes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Codes de récupération</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadBackupCodes}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Télécharger
                </Button>
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sauvegardez ces codes</strong> dans un endroit sécurisé. 
                  Ils vous permettront d'accéder à votre compte si vous perdez votre téléphone.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg">
                {backupCodes.map((code, index) => (
                  <div key={index} className="font-mono text-sm p-2 bg-white rounded border">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setSetupStep('setup')}
              className="flex-1"
            >
              Retour
            </Button>
            <Button
              onClick={verifyTwoFactor}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Vérifier et Activer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
