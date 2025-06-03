// frontend/src/pages/api/parse-bibtex.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

interface BibtexParseRequest { bibtex: string; }
interface ParsedBibtexResponse { title?: string; authors?: string[]; journal?: string; year?: number; doi?: string; }
interface ApiErrorResponse { message: string; details?: unknown; }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ParsedBibtexResponse | ApiErrorResponse>
) {
  if (req.method === 'POST') {
    const { bibtex } = req.body as BibtexParseRequest;
    if (!bibtex) {
      return res.status(400).json({ message: 'BibTeX content is required.' });
    }
    try {
      const backendResponse = await axios.post<ParsedBibtexResponse>(
        `${NESTJS_BACKEND_URL}/api/submissions/parse-bibtex`, 
        { bibtex }
      );
      return res.status(backendResponse.status).json(backendResponse.data);
    } catch (error: unknown) {
      let statusCode = 500;
      let responseMessage = 'Failed to parse BibTeX via backend.';
      let errorDetails: unknown = undefined;

      if (axios.isAxiosError(error)) {
        statusCode = error.response?.status || 500;
        responseMessage = (error.response?.data as ApiErrorResponse)?.message || error.message || responseMessage;
        errorDetails = error.response?.data;
      } else if (error instanceof Error) {
        responseMessage = error.message;
      }
      console.error('Parse BibTeX API proxy error:', responseMessage, error);
      return res.status(statusCode).json({ message: responseMessage, details: errorDetails });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}