// src/pages/analyst/dashboard.tsx (or tools.tsx, adjust filename as needed)
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../auth/context/AuthContext'; // Adjust path if needed

const AnalystDashboard = () => {
  const { userRole, isLoading } = useAuth(); // Assuming you have isLoading in AuthContext
  const router = useRouter();

  console.log("AnalystDashboard: Component instance created. Initial userRole:", userRole, "Initial isLoading:", isLoading);

  useEffect(() => {
    console.log("AnalystDashboard EFFECT: Fired. userRole:", userRole, "isLoading:", isLoading, "router.isReady:", router.isReady);

    // Only proceed if the router is ready and auth state is determined
    if (!router.isReady || isLoading) {
      console.log("AnalystDashboard EFFECT: Router not ready or Auth is loading. Aborting effect logic for now.");
      return; // Exit if router isn't ready or still loading auth state
    }

    // At this point, isLoading is false and router.isReady is true
    console.log("AnalystDashboard EFFECT: Auth loaded and router ready.");

    if (userRole === 'analyst') {
      console.log("AnalystDashboard EFFECT: Authorized as 'analyst'. No redirect needed from here.");
      // This is the correct state, stay on the page.
    } else if (userRole && userRole !== 'analyst') {
      // Logged in, but wrong role
      console.log(`AnalystDashboard EFFECT: Role is '${userRole}', not 'analyst'. Redirecting to '/'.`);
      router.replace('/');
    } else {
      // Not logged in (userRole is null)
      console.log("AnalystDashboard EFFECT: userRole is null (not logged in). Redirecting to '/auth/login'.");
      router.replace('/auth/login');
    }
  }, [userRole, isLoading, router]); // Dependencies for the effect

  // Render logic
  if (isLoading) {
    console.log("AnalystDashboard RENDER: isLoading is true. Rendering loading auth state...");
    return <div>Loading authentication state...</div>;
  }

  // At this point, isLoading is false. Now check userRole for rendering.
  if (userRole !== 'analyst') {
    console.log(`AnalystDashboard RENDER: userRole is '${userRole}' (not 'analyst' or null after loading). Rendering 'Verifying access...' (will be redirected by effect).`);
    return <h2>Verifying access... Please wait.</h2>;
  }

  // If isLoading is false AND userRole is 'analyst', render the dashboard content
  console.log("AnalystDashboard RENDER: Authorized. Rendering dashboard content.");
  return (
    <div>
      <h1>Analyst Dashboard</h1>
      <p>Welcome, Analyst! Here are your tools for analyzing data.</p>
      {/* Add Analyst-specific components and content here */}
    </div>
  );
};

export default AnalystDashboard;