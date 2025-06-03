import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios'; 

interface CreateSubmissionPayload {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi: string;
}

interface SubmissionResponse {
  _id: string;
  title: string;
  status: string; 
  createdAt: string;
}

interface ApiErrorResponse {
  message: string;
  error?: string | object;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<SubmissionResponse | ApiErrorResponse> 
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const submissionData = req.body as CreateSubmissionPayload;
    const nestJsBackendUrl = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';
    
    const response = await axios.post<SubmissionResponse>(
      `${nestJsBackendUrl}/api/submissions`, 
      submissionData
    );
    return res.status(response.status).json(response.data);

  } catch (error: unknown) {
    let statusCode = 500;
    const errorPayload: ApiErrorResponse = { 
        message: 'Submission to backend failed.',
    };

    if (axios.isAxiosError(error)) {
      const serverError = error as AxiosError<ApiErrorResponse>; 
      statusCode = serverError.response?.status || 500;
      errorPayload.message = serverError.response?.data?.message || serverError.message || errorPayload.message;
      if (serverError.response?.data?.error) {
        errorPayload.error = serverError.response.data.error;
      } else if (serverError.response?.data && typeof serverError.response.data !== 'string' && !serverError.response.data.message) {
        errorPayload.error = serverError.response.data;
      }
    } else if (error instanceof Error) {
      errorPayload.message = error.message;
    } else {
      errorPayload.message = 'An unexpected error occurred while processing the submission.';
    }

    console.error('Backend submission proxy error:', errorPayload.message, error);
    return res.status(statusCode).json(errorPayload);
  }
}