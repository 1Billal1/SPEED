import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const response = await axios.post('http://localhost:3001/api/submissions', req.body);
    return res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Backend submission error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: 'Submission failed',
      error: error.response?.data || error.message,
    });
  }
}
