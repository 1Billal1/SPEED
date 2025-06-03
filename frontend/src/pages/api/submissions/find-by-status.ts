// frontend/src/pages/api/submissions/find-by-status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

interface SubmissionListItem { _id: string; title?: string;}
interface PaginatedResponse { submissions: SubmissionListItem[]; total: number; currentPage: number; totalPages: number; }
interface ApiErrorResponse { message: string; details?: unknown; }

export default async function handler(req: NextApiRequest, res: NextApiResponse<PaginatedResponse | ApiErrorResponse>) {
  const { status, page, limit } = req.query as { status?: string; page?: string; limit?: string; };

  if (req.method === 'GET') {
    if (!status) {
      return res.status(400).json({ message: "Query parameter 'status' is required." });
    }
    try {
      const nestJsUrl = `${NESTJS_BACKEND_URL}/api/submissions/find-by-status`;
      const backendResponse = await axios.get<PaginatedResponse>(nestJsUrl, {
        params: { status, page, limit },
      });
      return res.status(backendResponse.status).json(backendResponse.data);
    } catch (error: unknown) {
      let statusCode = 500;
      let responseMessage = `Failed to fetch submissions for status ${status}.`;
      let errorDetails: unknown = undefined;

      if (axios.isAxiosError(error)) {
        statusCode = error.response?.status || 500;
        responseMessage = (error.response?.data as ApiErrorResponse)?.message || error.message || responseMessage;
        errorDetails = error.response?.data;
      } else if (error instanceof Error) {
        responseMessage = error.message;
      }
      console.error(`[PROXY] Error GET /find-by-status (status: ${status}):`, responseMessage, error);
      return res.status(statusCode).json({ message: responseMessage, details: errorDetails });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}