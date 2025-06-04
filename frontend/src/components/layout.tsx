import Link from 'next/link';
import { useEffect, useState, ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role);
  }, []);

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <span className="logo">SPEED</span>
          <ul className="nav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/submit">Submit</Link></li>
            <li><Link href="/claims">Claims</Link></li>

            {!userRole && (
              <>
                <li><Link href="/signup">Sign Up</Link></li>
                <li><Link href="/login">Log In</Link></li>
              </>
            )}

            {userRole === 'submitter' && (
              <li><Link href="/submit">Submitter Dashboard</Link></li>
            )}
            {userRole === 'moderator' && (
              <li><Link href="/moderator/dashboard">Moderator Dashboard</Link></li>
            )}
            {userRole === 'analyst' && (
              <li><Link href="/analyst/tools">Analyst Tools</Link></li>
            )}

            {userRole && (
              <li>
                <button className="logout-btn" onClick={() => {
                  localStorage.removeItem('role');
                  window.location.reload();
                }}>
                  Log Out
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
