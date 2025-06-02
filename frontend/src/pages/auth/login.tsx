// src/pages/auth/login.tsx
'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import styles from './auth.module.css'; // Make sure path is correct
import { useAuth } from './context/AuthContext'; // Make sure path is correct

export default function Login() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/login', { email, password });
      
      if (res.data && res.data.role) {
        console.log('Login successful, role received:', res.data.role); // Debug
        authLogin(res.data.role); // Set role in context
        
        // Role-based redirection:
        if (res.data.role === 'moderator') {
          console.log('Redirecting to moderator dashboard'); // Debug
          router.push('/moderator/dashboard');
        } else if (res.data.role === 'analyst') {
          console.log('Redirecting to analyst dashboard'); // Debug
          router.push('/analyst/dashboard'); // or your analyst page path
        } else if (res.data.role === 'submitter') {
          console.log('Redirecting to submitter dashboard'); // Debug
          router.push('/submit/dashboard');
        } else {
          console.log('Unknown role, redirecting to homepage'); // Debug
          router.push('/'); // Fallback
        }
      } else {
        setError('Login successful, but role not provided by the server.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleLogin} className={styles.form}>
        <h2 className={styles.title}>Login</h2>
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
        
        <p className={styles.signupText}>
          Don't have an account?{' '}
          {/* Ensure this href path is correct */}
          <a href="/auth/signup" className={styles.signupLink}>Sign up</a> 
        </p>

        <button type="submit" className={styles.button}>Login</button>
      </form>
    </div>
  );
}