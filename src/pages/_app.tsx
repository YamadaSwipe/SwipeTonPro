import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import '../styles/globals.css';

// Dynamic imports for non-critical components
const ErrorBoundary = dynamic(() => import('@/components/ErrorBoundary'), {
  ssr: false,
});
const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'), {
  ssr: false,
});
const WhatsAppButton = dynamic(
  () =>
    import('@/components/WhatsAppButton').then((m) => ({
      default: m.WhatsAppButton,
    })),
  {
    ssr: false,
  }
);

// Public routes that don't require AuthProvider (landing pages only)
const PUBLIC_ROUTES = ['/', '/about', '/contact', '/tarifs'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);

  if (isPublicRoute) {
    return (
      <ErrorBoundary>
        <Component {...pageProps} />
        <Toaster />
        <ScrollToTop />
        <WhatsAppButton />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster />
        <ScrollToTop />
        <WhatsAppButton />
      </AuthProvider>
    </ErrorBoundary>
  );
}
