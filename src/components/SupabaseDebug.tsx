"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

export function SupabaseDebug() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [details, setDetails] = useState<any>(null);

  const checkConnection = async () => {
    setStatus('loading');
    setDetails(null);

    try {
      // Vérification des variables d'environnement
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const envCheck = {
        url: !!supabaseUrl,
        anonKey: !!supabaseAnonKey,
        urlValid: supabaseUrl ? supabaseUrl.includes('supabase.co') : false
      };

      if (!envCheck.url || !envCheck.anonKey) {
        setStatus('error');
        setDetails({
          type: 'missing_env',
          message: 'Variables d\'environnement manquantes',
          env: envCheck
        });
        return;
      }

      // Test de connexion
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
      
      // Test simple
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus('error');
        setDetails({
          type: 'connection_error',
          message: error.message,
          code: error.status,
          env: envCheck
        });
        return;
      }

      setStatus('success');
      setDetails({
        type: 'connected',
        message: 'Connexion réussie',
        url: supabaseUrl,
        env: envCheck
      });

    } catch (err: any) {
      setStatus('error');
      setDetails({
        type: 'critical_error',
        message: err.message,
        env: null
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <RefreshCw className="w-5 h-5 animate-spin" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Connecté</Badge>;
      case 'error': return <Badge variant="destructive">Erreur</Badge>;
      default: return <Badge variant="secondary">Vérification...</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Debug Supabase
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {details && (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {details.message}
              </AlertDescription>
            </Alert>

            {details.env && (
              <div className="space-y-2">
                <h4 className="font-semibold">Variables d'environnement:</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>URL:</div>
                  <div className="col-span-2">
                    {details.env.url ? <CheckCircle className="w-4 h-4 text-green-500 inline" /> : <XCircle className="w-4 h-4 text-red-500 inline" />}
                    {details.env.url ? ' Configurée' : ' Manquante'}
                  </div>
                  
                  <div>Clé ANON:</div>
                  <div className="col-span-2">
                    {details.env.anonKey ? <CheckCircle className="w-4 h-4 text-green-500 inline" /> : <XCircle className="w-4 h-4 text-red-500 inline" />}
                    {details.env.anonKey ? ' Configurée' : ' Manquante'}
                  </div>
                  
                  <div>URL valide:</div>
                  <div className="col-span-2">
                    {details.env.urlValid ? <CheckCircle className="w-4 h-4 text-green-500 inline" /> : <XCircle className="w-4 h-4 text-red-500 inline" />}
                    {details.env.urlValid ? ' Format supabase.co' : ' Format invalide'}
                  </div>
                </div>
              </div>
            )}

            {details.url && (
              <div className="text-sm text-muted-foreground">
                <strong>URL Supabase:</strong> {details.url}
              </div>
            )}

            {details.code && (
              <div className="text-sm text-muted-foreground">
                <strong>Code d'erreur:</strong> {details.code}
              </div>
            )}
          </>
        )}

        <Button 
          onClick={checkConnection} 
          variant="outline" 
          className="w-full"
          disabled={status === 'loading'}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${status === 'loading' ? 'animate-spin' : ''}`} />
          Tester la connexion
        </Button>

        {status === 'error' && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <strong>Solutions possibles:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Vérifiez que le fichier .env.local existe</li>
              <li>Configurez NEXT_PUBLIC_SUPABASE_URL avec votre URL Supabase</li>
              <li>Configurez NEXT_PUBLIC_SUPABASE_ANON_KEY avec votre clé ANON</li>
              <li>Assurez-vous que le projet Supabase est actif</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
