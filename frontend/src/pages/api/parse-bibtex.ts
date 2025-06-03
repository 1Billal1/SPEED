import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { bibtex } = req.body;

  if (!bibtex || typeof bibtex !== 'string') {
    return res.status(400).json({ message: 'Invalid BibTeX content' });
  }

  try {
    const response = await axios.post('http://localhost:3001/api/submissions/parse-bibtex', { bibtex });
    return res.status(200).json(response.data);
  } catch (error: unknown) {
    let errorMessage = 'Unknown error';
    let backendError = null;

    if (axios.isAxiosError(error)) {
      errorMessage = error.message;
      backendError = error.response?.data || null;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('BibTeX parsing error:', backendError || errorMessage);

    return res.status(500).json({
      message: 'Failed to parse BibTeX',
      error: backendError || errorMessage,
    });
  }
}
