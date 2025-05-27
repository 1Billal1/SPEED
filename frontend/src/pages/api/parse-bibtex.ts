import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { bibtex } = req.body;
    if (!bibtex || typeof bibtex !== 'string') {
      return res.status(400).json({ message: 'Invalid BibTeX content' });
    }

    const response = await axios.post('http://localhost:3001/api/submissions/parse-bibtex', { bibtex });

    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Backend parsing error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Failed to parse BibTeX',
      error: error.response?.data || error.message,
    });
  }
}
