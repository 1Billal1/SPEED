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
}
