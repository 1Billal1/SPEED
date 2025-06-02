// pages/dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function SubmitterDashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
    setLoading(false);
    if (storedRole !== 'submitter') {
      router.push('/login');
    }
  }, [router]);

  if (loading || role !== 'submitter') {
    return null; // Avoid flashing the page before redirect
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <p>Welcome! You can view and manage your submissions here.</p>
    </div>
  );
}
