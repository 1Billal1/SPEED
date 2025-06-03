import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import type { AxiosError } from 'axios';

const NESTJS_BACKEND_URL = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };

  if (req.method === 'PATCH') {
    try {
      const nestJsUrl = `${NESTJS_BACKEND_URL}/api/submissions/${id}/moderate`;
      const backendResponse = await axios.patch(nestJsUrl, req.body);
      res.status(backendResponse.status).json(backendResponse.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          res
            .status(axiosError.response.status)
            .json(axiosError.response.data || { message: 'Error from backend during moderation' });
        } else {
          res
            .status(500)
            .json({ message: 'No response received from backend during moderation' });
        }
      } else if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Unknown error occurred during moderation' });
      }
    }
  } else {
    res.setHeader('Allow', ['PATCH']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
