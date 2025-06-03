// frontend/src/pages/api/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

interface SignupSuccessResponse { email: string; role: string; }
interface ApiErrorResponse { message: string; details?: unknown; }

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<SignupSuccessResponse | ApiErrorResponse>
) {
  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }
      const backendResponse = await axios.post<SignupSuccessResponse>(
        `${NESTJS_BACKEND_URL}/auth/signup`, 
        { email, password }
      );
      return res.status(backendResponse.status).json(backendResponse.data);
    } catch (error: unknown) {
      let statusCode = 500;
      let responseMessage = 'An internal server error occurred during signup.';
      let errorDetails: unknown = undefined;

      if (axios.isAxiosError(error)) {
        statusCode = error.response?.status || 500;
        responseMessage = (error.response?.data as ApiErrorResponse)?.message || error.message || responseMessage;
        errorDetails = error.response?.data;
      } else if (error instanceof Error) {
        responseMessage = error.message;
      }
      console.error('Signup API route error:', responseMessage, error);
      return res.status(statusCode).json({ message: responseMessage, details: errorDetails });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}