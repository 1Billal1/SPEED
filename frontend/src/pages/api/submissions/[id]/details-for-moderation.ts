import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === 'GET') {
    console.log(`[PROXY] GET /api/submissions/${id}/details-for-moderation HIT`);
    try {
      const nestJsUrl = `${NESTJS_BACKEND_URL}/api/submissions/${id}/details-for-moderation`;
      console.log("[PROXY] Calling NestJS GET at:", nestJsUrl);

      const backendResponse = await axios.get(nestJsUrl);
      console.log("[PROXY] NestJS GET response status:", backendResponse.status, "Data:", backendResponse.data);
      res.status(backendResponse.status).json(backendResponse.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("[PROXY] Axios error message:", error.message);
        if (error.response) {
          console.error("[PROXY] NestJS GET error status:", error.response.status, "Data:", error.response.data);
          res.status(error.response.status).json(error.response.data || { message: "Error from backend" });
        } else {
          res.status(500).json({ message: 'No response from backend' });
        }
      } else if (error instanceof Error) {
        console.error("[PROXY] Non-Axios error:", error.message);
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Unknown error occurred' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
