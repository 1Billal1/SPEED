'use client';
import { useState, FormEvent } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/router';
import styles from './auth.module.css';

interface ErrorResponse {
  message: string;
}

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); 
    try {
      await axios.post('/api/signup', { email, password });
      router.push('/auth/login'); 
    } catch (err) {
      let errorMessage = 'Signup failed. Please try again.';
      if (axios.isAxiosError(err)) {
        const serverError = err as AxiosError<ErrorResponse>;
        errorMessage = serverError.response?.data?.message || serverError.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = 'An unexpected error occurred during signup.';
      }
      setError(errorMessage);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSignup} className={styles.form}>
        <h2 className={styles.title}>Sign Up</h2>
        {error && <p className={styles.error}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          className={styles.input}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className={styles.input}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" className={styles.button}>Sign Up</button>
      </form>
    </div>
  );
}