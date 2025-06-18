// frontend/src/pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

interface NestJsLoginSuccessResponse {
  email: string;
  role: string;
}

interface ApiErrorResponse {
  message: string;
  statusCode?: number; 
  error?: string;      
  details?: unknown;   
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<NestJsLoginSuccessResponse | ApiErrorResponse>
) {
  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      const nestJsUrl = `${NESTJS_BACKEND_URL}/auth/login`; 
      console.log(`[API /api/login] Attempting to call NestJS backend at: ${nestJsUrl}`);
      
      const backendResponse = await axios.post<NestJsLoginSuccessResponse>(
        nestJsUrl,
        { email, password }
      );
      
      console.log(`[API /api/login] NestJS login response status: ${backendResponse.status}`);
      return res.status(backendResponse.status).json(backendResponse.data);

    } catch (error: unknown) {
      let statusCode = 500;
      let responseMessage = 'Login failed due to a server error.'; 
      let responseDetails: unknown = undefined; 

      if (axios.isAxiosError(error)) {
        const serverError = error as AxiosError<ApiErrorResponse>; 
        statusCode = serverError.response?.status || 500;
        responseMessage = serverError.response?.data?.message || serverError.message || responseMessage;
        responseDetails = serverError.response?.data;
        
        console.error(`[API /api/login] Axios Error: ${serverError.message}, Code: ${serverError.code}, Status from NestJS: ${statusCode}`);
        console.error(`[API /api/login] NestJS Error Response Body:`, responseDetails);

      } else if (error instanceof Error) {
        responseMessage = error.message;
        responseDetails = { stack: error.stack }; 
        console.error(`[API /api/login] Generic Error: ${error.message}`, error.stack);
      } else {
        responseMessage = 'An unknown error occurred during the login process.';
        responseDetails = error; 
        console.error(`[API /api/login] Unknown Error Structure:`, error);
      }
      
      return res.status(statusCode).json({ message: responseMessage, details: responseDetails });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}