import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

interface CreateSubmissionPayload {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi: string;
}

interface SubmissionCreationResponse {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface ErrorResponse {
  message: string;
  error?: string | object;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmissionCreationResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const submissionData = req.body as CreateSubmissionPayload;
    const nestJsBackendUrl = process.env.NEXT_PUBLIC_NESTJS_BACKEND_URL || 'http://localhost:3001';
    
    const response = await axios.post<SubmissionCreationResponse>(
      `${nestJsBackendUrl}/api/submissions`,
      submissionData
    );
    
    return res.status(response.status).json(response.data);

  } catch (error) {
    let statusCode = 500;
    let errorData: ErrorResponse = {
      message: 'Submission to backend failed.',
    };

    if (axios.isAxiosError(error)) {
      const serverError = error as AxiosError<ErrorResponse>;
      statusCode = serverError.response?.status || 500;
      errorData.message = serverError.response?.data?.message || serverError.message || 'Submission to backend failed.';
      errorData.error = serverError.response?.data?.error || serverError.response?.data;
    } else if (error instanceof Error) {
      errorData.message = error.message;
    } else {
      errorData.message = 'An unexpected error occurred while processing the submission.';
    }

    return res.status(statusCode).json(errorData);
  }
}