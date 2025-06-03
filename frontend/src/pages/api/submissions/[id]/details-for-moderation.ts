// frontend/src/pages/api/submissions/[id]/details-for-moderation.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

interface ApiErrorResponse { message: string; details?: unknown; }
interface SubmissionData { _id: string; title?: string;}
interface PotentialDuplicate { _id: string; title?: string;}
interface DetailsResponse { submission: SubmissionData; potentialDuplicates: PotentialDuplicate[]; }


export default async function handler(req: NextApiRequest, res: NextApiResponse<DetailsResponse | ApiErrorResponse>) {
  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    try {
      const nestJsUrl = `${NESTJS_BACKEND_URL}/api/submissions/${id}/details-for-moderation`;
      const backendResponse = await axios.get<DetailsResponse>(nestJsUrl);
      return res.status(backendResponse.status).json(backendResponse.data);
    } catch (error: unknown) {
      let statusCode = 500;
      let responseMessage = "Failed to fetch submission details.";
      let errorDetails: unknown = undefined;

      if (axios.isAxiosError(error)) {
        statusCode = error.response?.status || 500;
        responseMessage = (error.response?.data as ApiErrorResponse)?.message || error.message || responseMessage;
        errorDetails = error.response?.data;
      } else if (error instanceof Error) {
        responseMessage = error.message;
      }
      console.error(`[PROXY] Error GET /api/submissions/${id}/details-for-moderation:`, responseMessage, error);
      return res.status(statusCode).json({ message: responseMessage, details: errorDetails });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}