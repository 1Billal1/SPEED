// frontend/src/pages/moderator/dashboard.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useAuth } from '../auth/context/AuthContext'; // Adjust path as needed

// Define a clearer type for Submission on the frontend
interface FrontendSubmission {
  _id: string;
  title?: string;
  authors?: string[];
  journal?: string;
  year?: number; // Matches schema
  doi?: string;
  status: string; // 'pending', 'Accepted', 'Rejected'
  rejectionReason?: string;
  createdAt?: string; // From timestamps
  // Add other fields displayed or used by moderator
}

// Define the exact string values you'll use for status updates
const MODERATION_STATUS = {
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  // PENDING: 'pending' // This is what they arrive as
} as const; // Using 'as const' for type safety if you use these constants

const REJECTION_REASONS_LIST = ["Not empirical research", "Not peer-reviewed", "Out of scope", "Duplicate", "Other"];

const ModeratorDashboard = () => {
  const { userRole, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const [pendingSubmissions, setPendingSubmissions] = useState<FrontendSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  useEffect(() => {
    if (!authIsLoading) {
      if (userRole !== 'moderator') {
        router.replace(userRole ? '/' : '/auth/login');
      }
    }
  }, [userRole, authIsLoading, router]);

  useEffect(() => {
    if (userRole === 'moderator' && !authIsLoading) {
      const fetchSubmissions = async () => {
        setIsLoadingSubmissions(true);
        setError(null);
        try {
          console.log("ModeratorDashboard: Fetching /api/submissions/pending-moderation");
          const response = await axios.get('/api/pending-moderation'); 
          console.log("ModeratorDashboard: Fetched submissions:", response.data);
          setPendingSubmissions(response.data);
        } catch (err: any) {
          console.error("ModeratorDashboard: Failed to fetch pending submissions:", err);
          setError(err.response?.data?.message || "Failed to load submissions.");
        } finally {
          setIsLoadingSubmissions(false);
        }
      };
      fetchSubmissions();
    }
  }, [userRole, authIsLoading]);

const handleModerate = async (submissionId: string, newStatus: string, reason?: string) => {
  console.log(`ModeratorDashboard: Moderating ${submissionId} to ${newStatus} with reason: ${reason}`);
  try {
    await axios.patch(`/api/submissions/${submissionId}/moderate`, { // This is the URL causing 404
      status: newStatus,
      // Only send rejectionReason if the status is 'Rejected'
      ...(newStatus === MODERATION_STATUS.REJECTED && { rejectionReason: reason }),
    });
    setPendingSubmissions(prev => prev.filter(sub => sub._id !== submissionId));
    setSelectedSubmissionId(null);
    setCustomRejectionReason('');
  } catch (err: any) {
    console.error("ModeratorDashboard: Failed to moderate submission:", err);
    alert(`Error: ${err.response?.data?.message || "Failed to update submission."}`);
  }
};

  if (authIsLoading || (!authIsLoading && userRole !== 'moderator')) {
    return <div>Loading or checking authorization...</div>;
  }

  return (
    <div>
      <h1>Moderator Dashboard - Pending Submissions</h1>
      {isLoadingSubmissions && <p>Loading submissions...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {!isLoadingSubmissions && pendingSubmissions.length === 0 && !error && (
        <p>No submissions currently pending moderation.</p>
      )}

      {pendingSubmissions.map((submission) => (
        <div key={submission._id} style={{ border: '1px solid #ccc', margin: '1em 0', padding: '1em', borderRadius: '5px' }}>
          <h3>{submission.title || 'No Title'}</h3>
          <p><strong>Authors:</strong> {submission.authors?.join(', ') || 'N/A'}</p>
          <p><strong>Journal:</strong> {submission.journal || 'N/A'} | <strong>Year:</strong> {submission.year || 'N/A'}</p>
          {submission.doi && (
            <p><strong>DOI:</strong>{' '}
              <a href={`https://doi.org/${submission.doi}`} target="_blank" rel="noopener noreferrer" style={{color: '#007bff', textDecoration: 'underline'}}>
                {submission.doi}
              </a>
            </p>
          )}
          <p><strong>Submitted:</strong> {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Status:</strong> <span style={{fontWeight: 'bold'}}>{submission.status}</span></p>

          {selectedSubmissionId !== submission._id ? (
            <button onClick={() => { setSelectedSubmissionId(submission._id); setCustomRejectionReason(''); }}>
              Moderate this Submission
            </button>
          ) : (
            <div style={{ marginTop: '10px', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
              <h4>Actions for: {submission.title}</h4>
              <button 
                onClick={() => handleModerate(submission._id, MODERATION_STATUS.ACCEPTED)}
                style={{ marginRight: '10px', backgroundColor: 'lightgreen', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Accept
              </button>
              
              <div style={{marginTop: '10px'}}>
                <h5>Reject with Reason:</h5>
                {REJECTION_REASONS_LIST.map(reason => (
                  <button 
                    key={reason}
                    onClick={() => handleModerate(submission._id, MODERATION_STATUS.REJECTED, reason)}
                    style={{ marginRight: '5px', marginBottom: '5px', backgroundColor: 'lightcoral', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {reason}
                  </button>
                ))}
                <div style={{ marginTop: '5px' }}>
                  <input 
                    type="text" 
                    value={customRejectionReason} 
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    placeholder="Or type custom reason..."
                    style={{marginRight: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                  />
                  <button 
                    onClick={() => handleModerate(submission._id, MODERATION_STATUS.REJECTED, customRejectionReason || "Other (not specified)")}
                    disabled={!customRejectionReason.trim()}
                    style={{ backgroundColor: 'lightcoral', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Reject (Custom)
                  </button>
                </div>
              </div>
               <button onClick={() => setSelectedSubmissionId(null)} style={{marginTop: '15px', padding: '8px 12px'}}>Cancel Moderation</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ModeratorDashboard;