'use client';
import { useRouter } from 'next/router';
import { useEffect, useState, FormEvent, ChangeEvent } from 'react';
import axios, { AxiosError } from 'axios';
import styles from '../submit.module.css';

interface SubmissionData {
  _id?: string;
  title: string;
  authors: string[];
  journal: string;
  year: number | string;
  doi: string;
}

interface SubmissionDetailResponse {
    submission: SubmissionData;
}

interface ErrorResponse {
  message: string;
}

export default function EditSubmissionPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      setPageError(null);
      axios.get<SubmissionDetailResponse | SubmissionData>(`/api/submissions/${id}/details-for-moderation`)
        .then(response => {
          if (response.data && 'submission' in response.data && typeof response.data.submission === 'object') {
            setSubmission(response.data.submission as SubmissionData);
          } 
          else if (response.data && typeof response.data === 'object') {
            setSubmission(response.data as SubmissionData);
          }
          else {
            throw new Error("Unexpected data structure for submission details");
          }
        })
        .catch(err => {
          let errorMessage = 'Failed to fetch submission data.';
          if (axios.isAxiosError(err)) {
            const serverError = err as AxiosError<ErrorResponse>;
            errorMessage = serverError.response?.data?.message || serverError.message || errorMessage;
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }
          setPageError(errorMessage);
        })
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!submission) return;
    const { name, value } = e.target;
    if (name === "authors") {
        setSubmission({ ...submission, [name]: value.split(',').map(a => a.trim()) });
    } else {
        setSubmission({ ...submission, [name]: value });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    setFormError(null);

    const dataToSubmit: Partial<SubmissionData> = {
        ...submission,
        year: Number(submission.year) || 0,
    };
    
    try {
      await axios.patch(`/api/submissions/${id}`, dataToSubmit); 
      router.push('/submit/dashboard'); 
    } catch (err) {
      let errorMessage = 'Failed to update submission.';
      if (axios.isAxiosError(err)) {
        const serverError = err as AxiosError<ErrorResponse>;
        errorMessage = serverError.response?.data?.message || serverError.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setFormError(errorMessage);
    }
  };

  if (isLoading) return <p>Loading submission...</p>;
  if (pageError) return <p>Error loading submission: {pageError}</p>;
  if (!submission && !isLoading) return <p>Submission not found or ID missing.</p>;
  if (!submission) return null;

  return (
      <div className={styles.formContainer}>
        <h1>Edit Submission: {submission.title}</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Title</label>
            <input type="text" name="title" id="title" value={submission.title || ''} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="authors">Authors (comma-separated)</label>
            <input type="text" name="authors" id="authors" value={submission.authors?.join(', ') || ''} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="journal">Journal / Conference</label>
            <input type="text" name="journal" id="journal" value={submission.journal || ''} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="year">Year</label>
            <input type="number" name="year" id="year" value={submission.year || ''} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="doi">DOI</label>
            <input type="text" name="doi" id="doi" value={submission.doi || ''} onChange={handleChange} required />
          </div>
          
          {formError && <p className={styles.errorText}>{formError}</p>}
          <button type="submit" className={styles.submitButton}>Update Submission</button>
        </form>
      </div>
  );
}