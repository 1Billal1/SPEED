import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const backendResponse = await axios.post(`${NESTJS_BACKEND_URL}/auth/login`, {
        email,
        password,
      });

      res.status(backendResponse.status).json(backendResponse.data);
    } catch (error) {
      let status = 500;
      let message = 'An internal server error occurred during login.';
      
      if (axios.isAxiosError(error) && error.response) {
        status = error.response.status;
        message = error.response.data?.message || error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      console.error('Login API route error:', message, error);
      res.status(status).json({ message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}