// frontend/src/pages/api/submissions/[id]/moderate.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Ensure this environment variable is set in your .env.local or directly here for testing
const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract the dynamic 'id' parameter from the request query
  const { id } = req.query as { id: string }; // Type assertion for clarity

  // This API route specifically handles PATCH requests for moderation
  if (req.method === 'PATCH') {
    console.log(`Next.js API PROXY: PATCH /api/submissions/${id}/moderate HIT`);
    console.log(`Next.js API PROXY: Request body:`, req.body);

    try {
      // Construct the URL to your NestJS backend endpoint
      const nestJsUrl = `${NESTJS_BACKEND_URL}/api/submissions/${id}/moderate`;
      console.log(`Next.js API PROXY: Forwarding PATCH to NestJS at: ${nestJsUrl}`);

      // Forward the PATCH request (including the body) to the NestJS backend
      // TODO: If your NestJS backend requires authentication (e.g., JWT),
      // you'll need to extract the token from req.headers.authorization (or a cookie)
      // and forward it in the headers of this axios call.
      const backendResponse = await axios.patch(nestJsUrl, req.body, {
        // headers: {
        //   Authorization: req.headers.authorization, // Example: Forwarding auth header
        //   'Content-Type': 'application/json', // Axios usually sets this for objects
        // },
      });

      console.log(`Next.js API PROXY: NestJS PATCH response status: ${backendResponse.status}, data:`, backendResponse.data);
      // Send the NestJS backend's response back to the client (ModeratorDashboard)
      res.status(backendResponse.status).json(backendResponse.data);

    } catch (error: any) {
      console.error("Next.js API PROXY: Error proxying PATCH to NestJS backend:", error.message);
      if (error.response) {
        // If the error has a response object (meaning NestJS responded with an error)
        console.error("Next.js API PROXY: NestJS error response status:", error.response.status);
        console.error("Next.js API PROXY: NestJS error response data:", error.response.data);
        res.status(error.response.status).json(error.response.data || { message: "Error from backend during moderation" });
      } else {
        // Network error or other issue before NestJS could respond
        res.status(500).json({ message: 'Internal server error in Next.js API proxy while attempting to moderate' });
      }
    }
  } else {
    // If any other HTTP method is used for this route
    console.log(`Next.js API PROXY: /api/submissions/${id}/moderate received method ${req.method}, but only PATCH is allowed.`);
    res.setHeader('Allow', ['PATCH']); // Inform the client which methods are allowed
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}