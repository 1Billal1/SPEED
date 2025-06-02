// your-nextjs-project/pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// IMPORTANT: Replace with your actual NestJS backend URL
// You can use an environment variable for this in a real application
const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      // Forward the request to your NestJS backend's /auth/login endpoint
      const backendResponse = await axios.post(`${NESTJS_BACKEND_URL}/auth/login`, {
        email,
        password,
      });

      // Send the NestJS backend's response (e.g., user data with role) back to the frontend
      res.status(backendResponse.status).json(backendResponse.data);
    } catch (error: any) {
      // Handle errors from the NestJS backend or other issues
      console.error('Login API route error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { message: 'An internal server error occurred during login.' });
    }
  } else {
    // Handle any other HTTP methods
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}