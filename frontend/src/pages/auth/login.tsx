// frontend/src/pages/auth/login.tsx
'use client';
import { useState, FormEvent } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './auth.module.css'; 
import { useAuth } from './context/AuthContext';

interface LoginResponse { email: string; role: string; }
interface ApiErrorResponse { message: string; details?: unknown; }

export default function Login() {
  const router = useRouter();
  const { login: authLogin } = useAuth(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); 
    try {
      const res = await axios.post<LoginResponse>('/api/login', { email, password }); 
      if (res.data && res.data.role) {
        authLogin(res.data.role); 
        if (res.data.role === 'moderator') router.push('/moderator/dashboard');
        else if (res.data.role === 'analyst') router.push('/analyst/dashboard');
        else if (res.data.role === 'submitter') router.push('/submit/dashboard');
        else router.push('/');
      } else {
        setError('Login successful, but role not provided by server.');
      }
    } catch (err: unknown) {
      let errorMessage = 'Login failed. Please check your credentials.';
      if (axios.isAxiosError(err)) {
        const serverError = err as AxiosError<ApiErrorResponse>;
        errorMessage = serverError.response?.data?.message || serverError.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleLogin} className={styles.form}>
        <h2 className={styles.title}>Login</h2>
        {error && <p className={styles.error}>{error}</p>}
        <input type="email" placeholder="Email" className={styles.input} value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className={styles.input} value={password} onChange={e => setPassword(e.target.value)} required />
        <p className={styles.signupText}>
          Don't have an account?{' '}
          <Link href="/auth/signup" className={styles.signupLink}>Sign up</Link>
        </p>
        <button type="submit" className={styles.button}>Login</button>
      </form>
    </div>
  );
}