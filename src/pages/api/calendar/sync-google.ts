import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { professionalId } = req.body;

    // Récupérer les tokens Google du professionnel
    const { data: professional, error: proError } = await (supabase as any)
      .from('professionals')
      .select('google_access_token, google_refresh_token, google_calendar_id')
      .eq('id', professionalId)
      .single();

    if (proError || !professional?.google_access_token) {
      return res.status(400).json({ 
        error: 'Google Calendar non connecté pour ce professionnel' 
      });
    }

    // Initialiser OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: professional.google_access_token,
      refresh_token: professional.google_refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Récupérer les événements Google Calendar (30 jours)
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: professional.google_calendar_id || 'primary',
      timeMin: now.toISOString(),
      timeMax: thirtyDaysLater.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items || [];
    let syncedCount = 0;

    // Synchroniser chaque événement
    for (const event of events) {
      if (!event.start?.dateTime || !event.end?.dateTime) continue;

      const startDate = new Date(event.start.dateTime);
      const endDate = new Date(event.end.dateTime);
      const dateStr = startDate.toISOString().split('T')[0];
      const startTime = startDate.toTimeString().slice(0, 5);
      const endTime = endDate.toTimeString().slice(0, 5);

      // Vérifier si le time slot existe déjà
      const { data: existingSlot } = await (supabase as any)
        .from('time_slots')
        .select('id')
        .eq('professional_id', professionalId)
        .eq('date', dateStr)
        .eq('start_time', startTime)
        .eq('end_time', endTime)
        .single();

      if (!existingSlot) {
        // Créer le time slot
        const { error: insertError } = await (supabase as any)
          .from('time_slots')
          .insert({
            professional_id: professionalId,
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
            is_available: false, // Les événements Google sont considérés comme occupés
            google_event_id: event.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (!insertError) {
          syncedCount++;
        }
      }
    }

    res.status(200).json({ 
      success: true, 
      synced: syncedCount,
      total: events.length 
    });

  } catch (error: any) {
    console.error('Google Calendar sync error:', error);
    
    // Si c'est une erreur de token expiré, essayer de rafraîchir
    if (error.code === 401) {
      try {
        // Implémenter la logique de refresh token ici
        res.status(401).json({ 
          error: 'Token Google expiré. Veuillez reconnecter Google Calendar.' 
        });
      } catch (refreshError) {
        res.status(500).json({ error: 'Erreur de rafraîchissement du token' });
      }
    } else {
      res.status(500).json({ error: 'Erreur de synchronisation Google Calendar' });
    }
  }
}
