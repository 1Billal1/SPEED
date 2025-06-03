import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page, limit } = req.query as { page?: string; limit?: string };

  if (req.method === 'GET') {
    console.log("[Next.js Proxy] GET /api/submissions/pending-moderation HIT. Query:", { page, limit });
    try {
      const nestJsUrl = `${NESTJS_BACKEND_URL}/api/submissions/pending-moderation`;
      console.log("[Next.js Proxy] Calling NestJS GET at:", nestJsUrl, "with params:", { page, limit });

      const backendResponse = await axios.get(nestJsUrl, {
        params: { page, limit },
      });

      console.log("[Next.js Proxy] NestJS GET pending-moderation response status:", backendResponse.status);
      res.status(backendResponse.status).json(backendResponse.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("[Next.js Proxy] Axios error:", error.response?.data || error.message);
        if (error.response) {
          res.status(error.response.status).json(error.response.data || { message: "Error from backend" });
        } else {
          res.status(500).json({ message: 'No response from backend' });
        }
      } else if (error instanceof Error) {
        console.error("[Next.js Proxy] Unexpected error:", error.message);
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Unknown error in Next.js API proxy' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
