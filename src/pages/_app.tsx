import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
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

export default function App({ Component, pageProps }: AppProps) {
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
