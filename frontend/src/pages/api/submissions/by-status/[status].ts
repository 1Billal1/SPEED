import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { status, page, limit } = req.query as { 
    status: string; 
    page?: string;
    limit?: string; 
  };

  if (req.method === 'GET') {
    try {
      const nestJsUrl = `${NESTJS_BACKEND_URL}/api/submissions/by-status/${status}`;
      const backendResponse = await axios.get(nestJsUrl, {
        params: { page, limit },
      });
      res.status(backendResponse.status).json(backendResponse.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          res
            .status(axiosError.response.status)
            .json(axiosError.response.data || { message: `Error from backend fetching status ${status}` });
        } else {
          res
            .status(500)
            .json({ message: `No response from backend for status ${status}` });
        }
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: `Unknown error while fetching submissions with status ${status}` });
      }
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
