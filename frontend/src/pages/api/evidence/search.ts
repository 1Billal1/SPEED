// frontend/src/pages/api/evidence/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

interface ApiErrorResponse {
  message: string;
  details?: unknown; 
}

interface NestJSSearchSuccessResponse {
  total: number;
  currentPage: number;
  totalPages: number;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<NestJSSearchSuccessResponse | ApiErrorResponse>
) {
  if (req.method === 'GET') {
    const { sePractice, keywords, page, limit } = req.query;
    
    console.log(`[Next.js Proxy /api/evidence/search] Received GET. Query:`, req.query);
    
    try {
      const nestJsUrl = `${NESTJS_BACKEND_URL}/api/evidence-entries/search`; 
      console.log("[Next.js Proxy] Calling NestJS GET at:", nestJsUrl, "with params:", { sePractice, keywords, page, limit });

      const backendResponse = await axios.get<NestJSSearchSuccessResponse>(nestJsUrl, { 
        params: { sePractice, keywords, page, limit } 
      });

      console.log("[Next.js Proxy] NestJS search response status:", backendResponse.status);
      return res.status(backendResponse.status).json(backendResponse.data);

    } catch (error: unknown) {
      let statusCode = 500;
      let responseMessage = "Search request failed due to a server error.";
      let errorDetails: unknown = undefined;

      if (axios.isAxiosError(error)) {
        const serverError = error as AxiosError<ApiErrorResponse>;
        statusCode = serverError.response?.status || 500;
        responseMessage = serverError.response?.data?.message || serverError.message || responseMessage;
        errorDetails = serverError.response?.data;
      } else if (error instanceof Error) {
        responseMessage = error.message;
      } else {
        responseMessage = "An unknown error occurred during the search proxy.";
      }
      console.error("[Next.js Proxy /api/evidence/search] Error:", responseMessage, error);
      return res.status(statusCode).json({ message: responseMessage, details: errorDetails });
    }
  } else {
    console.log(`[Next.js Proxy /api/evidence/search] Method ${req.method} not allowed.`);
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}