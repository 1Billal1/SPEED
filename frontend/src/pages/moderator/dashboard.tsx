// src/pages/moderator/dashboard.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../auth/context/AuthContext'; // Adjust path if needed

const ModeratorDashboard = () => {
  const { userRole, isLoading } = useAuth(); // Assuming you have isLoading in AuthContext
  const router = useRouter();

  console.log("ModeratorDashboard: Component instance created. Initial userRole:", userRole, "Initial isLoading:", isLoading);

  useEffect(() => {
    console.log("ModeratorDashboard EFFECT: Fired. userRole:", userRole, "isLoading:", isLoading, "router.isReady:", router.isReady);

    // Only proceed if the router is ready and auth state is determined
    if (!router.isReady || isLoading) {
      console.log("ModeratorDashboard EFFECT: Router not ready or Auth is loading. Aborting effect logic for now.");
      return; // Exit if router isn't ready or still loading auth state
    }

    // At this point, isLoading is false and router.isReady is true
    console.log("ModeratorDashboard EFFECT: Auth loaded and router ready.");

    if (userRole === 'moderator') {
      console.log("ModeratorDashboard EFFECT: Authorized as 'moderator'. No redirect needed from here.");
      // This is the correct state, stay on the page.
    } else if (userRole && userRole !== 'moderator') {
      // Logged in, but wrong role
      console.log(`ModeratorDashboard EFFECT: Role is '${userRole}', not 'moderator'. Redirecting to '/'.`);
      router.replace('/');
    } else {
      // Not logged in (userRole is null)
      console.log("ModeratorDashboard EFFECT: userRole is null (not logged in). Redirecting to '/auth/login'.");
      router.replace('/auth/login');
    }
  }, [userRole, isLoading, router]); // Dependencies for the effect

  // Render logic
  if (isLoading) {
    console.log("ModeratorDashboard RENDER: isLoading is true. Rendering loading auth state...");
    return <div>Loading authentication state...</div>;
  }

  // At this point, isLoading is false. Now check userRole for rendering.
  if (userRole !== 'moderator') {
    console.log(`ModeratorDashboard RENDER: userRole is '${userRole}' (not 'moderator' or null after loading). Rendering 'Verifying access...' (will be redirected by effect).`);
    // This message will show briefly if the useEffect is about to redirect them.
    // Or if they somehow bypass the effect's redirect (e.g., direct navigation and effect hasn't run yet for redirect).
    return <h2>Verifying access... Please wait.</h2>;
  }

  // If isLoading is false AND userRole is 'moderator', render the dashboard content
  console.log("ModeratorDashboard RENDER: Authorized. Rendering dashboard content.");
  return (
    <div>
      <h1>Moderator Dashboard</h1>
      <p>Welcome, Moderator! This is where you manage submissions.</p>
      {/* Add Moderator-specific components and content here */}
    </div>
  );
};

export default ModeratorDashboard;