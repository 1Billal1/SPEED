// frontend/src/pages/api/submissions/pending-moderation.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001'; 
const nestJsUrl = `${NESTJS_BACKEND_URL}/api/submissions/pending-moderation`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    console.log("Next.js API PROXY: /api/submissions/pending-moderation HIT");
    try {
      const nestJsUrl = `${NESTJS_BACKEND_URL}/api/submissions/pending-moderation`; // Match NestJS controller path
      console.log("Next.js API PROXY: Calling NestJS at:", nestJsUrl);

      // TODO: Forward Authorization header from client if NestJS endpoint is protected
      // const token = req.headers.authorization;
      const backendResponse = await axios.get(nestJsUrl, {
        // headers: token ? { Authorization: token } : {},
      });

      console.log("Next.js API PROXY: NestJS response status:", backendResponse.status);
      res.status(backendResponse.status).json(backendResponse.data);
    } catch (error: any) {
      console.error("Next.js API PROXY: Error proxying to NestJS backend:", error.message);
      if (error.response) {
        console.error("Next.js API PROXY: NestJS error response status:", error.response.status);
        console.error("Next.js API PROXY: NestJS error response data:", error.response.data);
        res.status(error.response.status).json(error.response.data || { message: "Error from backend" });
      } else {
        res.status(500).json({ message: 'Internal server error in Next.js API proxy' });
      }
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}