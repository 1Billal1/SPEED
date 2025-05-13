import type { NextApiRequest, NextApiResponse } from "next";
import axios from 'axios';

type Data = {
  name: string;
  // Add other expected response fields here
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    // Fetch data from your NestJS backend
    const response = await axios.get('http://localhost:3000/api/data');
    
    // Forward the response from NestJS to the frontend
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching data from backend:', error);
    res.status(500).json({ name: 'Error fetching data' });
  }
}