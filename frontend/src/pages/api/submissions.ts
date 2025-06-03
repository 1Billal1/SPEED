// frontend/src/pages/api/submissions.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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
  error?: string | object | undefined;
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
    let responseMessage = 'Submission to backend failed.';
    let errorDetails: string | object | undefined;

    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status || 500;
      const responseData = error.response?.data as ApiErrorResponse | undefined;
      responseMessage = responseData?.message || error.message || responseMessage;
      errorDetails = responseData?.error || responseData;
    } else if (error instanceof Error) {
      responseMessage = error.message;
    } else {
      responseMessage = 'An unexpected error occurred while processing the submission.';
    }
    console.error('Backend submission proxy error:', responseMessage, error);
    
    const errorResponsePayload: ApiErrorResponse = { message: responseMessage };
    if (errorDetails !== undefined) {
        errorResponsePayload.error = errorDetails;
    }
    return res.status(statusCode).json(errorResponsePayload);
  }
}