import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const backendResponse = await axios.post(`${NESTJS_BACKEND_URL}/auth/signup`, {
        email,
        password,
      });

      res.status(backendResponse.status).json(backendResponse.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Signup API route Axios error:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { message: 'Error from backend during signup.' });
      } else if (error instanceof Error) {
        console.error('Signup API route unexpected error:', error.message);
        res.status(500).json({ message: error.message });
      } else {
        console.error('Signup API route unknown error');
        res.status(500).json({ message: 'Unknown error occurred during signup.' });
      }
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
