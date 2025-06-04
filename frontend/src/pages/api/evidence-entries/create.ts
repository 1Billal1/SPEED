// frontend/src/pages/api/evidence-entries/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios'; // Keep AxiosError for detailed typing

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

interface ApiErrorResponse { message: string; details?: unknown; statusCode?: number; error?: string; }
interface CreateEvidenceSuccessResponse { _id: string; /* ... other fields ... */ }

export default async function handler(
    req: NextApiRequest, 
    res: NextApiResponse<CreateEvidenceSuccessResponse | ApiErrorResponse>
) {
  // LOG 1: Check if the handler is hit and with what method/body
  console.log(`[Next.js API Proxy - /api/evidence-entries/create] Request received. Method: ${req.method}`);
  if (req.method === 'POST') {
    console.log(`[Next.js API Proxy] Body received:`, req.body); // LOG 1A

    try {
      const nestJsUrl = `${NESTJS_BACKEND_URL}/api/evidence-entries`; 
      console.log("[Next.js API Proxy] Attempting to call NestJS POST at:", nestJsUrl); // LOG 2
      
      const backendResponse = await axios.post<CreateEvidenceSuccessResponse>(nestJsUrl, req.body, {
        // headers: { Authorization: req.headers.authorization }, // TODO: Forward auth
      });

      console.log("[Next.js API Proxy] NestJS POST successful. Status:", backendResponse.status, "Data:", backendResponse.data); // LOG 3
      return res.status(backendResponse.status).json(backendResponse.data);

    } catch (error: unknown) {
      console.error("[Next.js API Proxy] --- ERROR CAUGHT IN /api/evidence-entries/create PROXY ---"); // LOG 4

      let statusCode = 500;
      let responseMessage = "Failed to save evidence entry due to a server error.";
      let errorDetails: unknown = undefined;

      if (axios.isAxiosError(error)) {
        const serverError = error as AxiosError<ApiErrorResponse>; // Cast for specific structure
        console.error("[Next.js API Proxy] Axios error details:", {
          message: serverError.message,
          code: serverError.code,
          status: serverError.response?.status,
          data: serverError.response?.data,
        }); // LOG 5 (Detailed Axios Error)

        statusCode = serverError.response?.status || 500;
        responseMessage = serverError.response?.data?.message || serverError.message || responseMessage;
        errorDetails = serverError.response?.data;
      } else if (error instanceof Error) {
        console.error("[Next.js API Proxy] Generic JavaScript error in proxy:", error.message, error.stack); // LOG 6
        responseMessage = error.message;
        errorDetails = { stack: error.stack };
      } else {
        console.error("[Next.js API Proxy] Unknown error structure caught in proxy:", error); // LOG 7
        errorDetails = error;
      }
      
      console.error(`[Next.js API Proxy] Sending ${statusCode} response. Original error stringified: ${String(error)}`);
      return res.status(statusCode).json({ message: responseMessage, details: errorDetails });
    }
  } else {
    console.log(`[Next.js API Proxy] Method ${req.method} not allowed for /api/evidence-entries/create.`); // LOG 8
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}