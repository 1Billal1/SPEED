// src/components/layout.tsx
import Link from 'next/link';
import { ReactNode } from 'react';
import { useAuth } from '../pages/auth/context/AuthContext'; // Ensure path is correct
import styles from './Layout.module.css'; // Import the CSS Module

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  const { userRole, logout, isLoading } // Assuming isLoading is available from useAuth
    = useAuth();

  return (
    <div className={styles.layoutWrapper}>
      <nav className={styles.navbar}>
        <div className={styles.navbarContainer}>
          <Link href="/" className={styles.navbarLogo}>
            SPEED
          </Link>
          
          <ul className={styles.navbarLinks}>
            <li><Link href="/">Home</Link></li>

            {userRole === 'submitter' && (
              <li><Link href="/submit">Submit Article</Link></li>
            )}

            {!userRole && !isLoading && (
              <>
                <li><Link href="/auth/signup">Sign Up</Link></li>
                <li><Link href="/auth/login">Log In</Link></li>
              </>
            )}

            {userRole === 'submitter' && (
              <li><Link href="/submit/dashboard">My Submissions</Link></li>
            )}
            {userRole === 'moderator' && (
              <li><Link href="/moderator/dashboard">Moderation</Link></li>
            )}
            {userRole === 'analyst' && (
              <li><Link href="/analyst/dashboard">Analysis</Link></li>
            )}

            {userRole && (
              <li>
                <button className={styles.logoutBtn} onClick={logout}>
                  Log Out
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>

      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}