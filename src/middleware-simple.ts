// Version simplifiée du middleware pour diagnostiquer les problèmes d'auth
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Rôles autorisés pour les routes admin
const ADMIN_ROLES = ['super_admin', 'admin', 'support', 'moderator'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si c'est une route admin
  if (pathname.startsWith('/admin')) {
    console.log('🔍 Middleware: Checking admin route:', pathname);
    
    try {
      // Pour l'instant, juste vérifier s'il y a un cookie
      const hasToken = request.cookies.get('sb-access-token')?.value;
      
      if (!hasToken) {
        console.log('❌ No token found, redirecting to login');
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      console.log('✅ Token found, allowing access for debugging');
      
      // Pour l'instant, autoriser l'accès sans validation stricte
      // pour diagnostiquer le problème
      const response = NextResponse.next();
      response.headers.set('x-debug', 'middleware-passed');
      return response;

    } catch (error) {
      console.error('❌ Middleware error:', error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
