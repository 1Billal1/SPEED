// your-nextjs-project/src/pages/auth/signup.tsx
'use client'; // If using Next.js App Router, otherwise remove if using Pages Router primarily
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router'; // For Pages Router
// If using App Router (Next.js 13+): import { useRouter } from 'next/navigation';
import styles from './auth.module.css'; // Assuming this path is correct

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      // Ensure this path matches your Next.js API route file
      // The backend (NestJS auth.service.ts) will assign the 'submitter' role by default.
      await axios.post('/api/signup', { email, password });
      
      // Redirect to login page after successful signup
      router.push('/auth/login'); 
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
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