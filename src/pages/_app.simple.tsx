import { Toaster } from "@/components/ui/toaster";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  console.log('🧪 Simplified App component loaded');
  
  return (
    <>
      <Component {...pageProps} />
      <Toaster />
    </>
  );
}
