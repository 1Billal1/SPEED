<<<<<<< Updated upstream
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
=======
import type { AppProps } from 'next/app';
import Layout from '../components/layout';
import { AuthProvider } from './auth/context/AuthContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
>>>>>>> Stashed changes
}
