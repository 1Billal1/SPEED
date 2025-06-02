import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface Submission {
  _id: string;
  submitterId: string;
  bibtex: string;
  status: string;
  [key: string]: any; 
}

export default function EditSubmissionPage() {
  const router = useRouter();
  const { id } = router.query;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [bibtex, setBibtex] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchSubmission = async () => {
      try {
        const res = await axios.get(`/api/submissions/${id}`);
        const data = res.data;

        if (data.status !== 'pending') {
          setError('This submission cannot be edited as moderation has already started.');
        } else {
          setSubmission(data);
          setBibtex(data.bibtex);
        }
      } catch (err: any) {
        setError('Failed to fetch submission.');
        console.error(err);
      }
    };

    fetchSubmission();
  }, [id]);

  const handleUpdate = async () => {
    setError('');
    setSuccess('');

    try {
      const res = await axios.patch(`/api/submissions/${id}`, {
        bibtex: bibtex,
        // Add other editable fields here if needed
      });

      setSuccess('Submission updated successfully!');
      setSubmission(res.data);
    } catch (err: any) {
      setError('Failed to update submission.');
      console.error(err);
    }
  };

  if (!submission) {
    return <div className="p-4">Loading submission...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Submission</h1>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}

      <label htmlFor="bibtex" className="block font-medium mb-2">BibTeX Entry:</label>
      <textarea
        id="bibtex"
        value={bibtex}
        onChange={(e) => setBibtex(e.target.value)}
        rows={10}
        className="w-full border rounded p-2 mb-4"
      />

      <button
        onClick={handleUpdate}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save Changes
      </button>
    </div>
  );
}
