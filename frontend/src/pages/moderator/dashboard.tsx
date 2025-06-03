// frontend/src/pages/moderator/dashboard.tsx
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../auth/context/AuthContext';
import styles from './ModeratorDashboard.module.css';

// --- Types ---
interface FrontendSubmission {
  _id: string;
  title?: string;
  authors?: string[];
  journal?: string;
  year?: number;
  doi?: string;
  status: string;
  rejectionReason?: string;
  createdAt?: string;
  similarityScore?: number;
}

interface SubmissionDetailsForModeration {
  submission: FrontendSubmission;
  potentialDuplicates: FrontendSubmission[];
}

interface PaginatedSubmissionsResponse {
  submissions: FrontendSubmission[];
  total: number;
  currentPage: number;
  totalPages: number;
}

interface ApiErrorResponse {
    message: string;
    error?: string | object; 
}

type SubmissionListView = 'pending' | 'accepted' | 'rejected';

const MODERATION_STATUS = { ACCEPTED: 'Accepted', REJECTED: 'Rejected' } as const;
const OTHER_REJECTION_REASONS_LIST = ["Not empirical research", "Not peer-reviewed", "Out of scope", "Other"];
const ITEMS_PER_PAGE = 10;

const ModeratorDashboard = () => {
  const { userRole, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  const [currentListView, setCurrentListView] = useState<SubmissionListView>('pending');
  const [listedSubmissions, setListedSubmissions] = useState<FrontendSubmission[]>([]);
  const [isLoadingListedSubmissions, setIsLoadingListedSubmissions] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [submissionDetails, setSubmissionDetails] = useState<SubmissionDetailsForModeration | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  useEffect(() => {
    if (!authIsLoading && userRole !== 'moderator') {
      router.replace(userRole ? '/' : '/auth/login');
    }
  }, [userRole, authIsLoading, router]);

  const fetchSubmissionsList = useCallback(async () => {
    if (userRole !== 'moderator' || authIsLoading) return;
    setIsLoadingListedSubmissions(true);
    setListError(null);
    const endpoint = '/api/submissions/find-by-status';
    const params = { status: currentListView, page: currentPage, limit: ITEMS_PER_PAGE };
    try {
      const response = await axios.get<PaginatedSubmissionsResponse>(endpoint, { params });
      if (response.data && Array.isArray(response.data.submissions)) {
        setListedSubmissions(response.data.submissions);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
        setCurrentPage(response.data.currentPage);
      } else {
        console.error("[FE Dashboard] Unexpected data structure from list API:", response.data);
        setListError("Received invalid data structure from server.");
        setListedSubmissions([]); setTotalPages(1); setTotalItems(0); setCurrentPage(1);
      }
    } catch (err) {
      let errorMessage = `Failed to load ${currentListView} submissions.`;
      if (axios.isAxiosError(err)) {
        const serverError = err as AxiosError<ApiErrorResponse>;
        errorMessage = serverError.response?.data?.message || serverError.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(`[FE Dashboard] Failed to fetch ${currentListView} submissions:`, err);
      setListError(errorMessage);
      setListedSubmissions([]); setTotalPages(1); setTotalItems(0); setCurrentPage(1);
    } finally {
      setIsLoadingListedSubmissions(false);
    }
  }, [userRole, authIsLoading, currentListView, currentPage]);

  useEffect(() => { fetchSubmissionsList(); }, [fetchSubmissionsList]);

  const handleSelectSubmissionForModeration = async (submissionId: string) => {
    if (selectedSubmissionId === submissionId && (submissionDetails || isLoadingDetails)) return;
    setSelectedSubmissionId(submissionId);
    setSubmissionDetails(null); setIsLoadingDetails(true); setDetailsError(null); 
    try {
      const response = await axios.get<SubmissionDetailsForModeration>(`/api/submissions/${submissionId}/details-for-moderation`); 
      if (response.data && response.data.submission && Array.isArray(response.data.potentialDuplicates)) {
        setSubmissionDetails(response.data);
      } else {
        console.error("[FE Dashboard] Unexpected data structure from details API:", response.data);
        setDetailsError("Received invalid data structure for submission details.");
        setSubmissionDetails(null);
      }
    } catch (err) { 
      let errorMessage = "Failed to load submission details.";
       if (axios.isAxiosError(err)) {
        const serverError = err as AxiosError<ApiErrorResponse>;
        errorMessage = serverError.response?.data?.message || serverError.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(`[FE Dashboard] Failed to fetch details for submission ${submissionId}:`, err);
      setDetailsError(errorMessage);
      setSubmissionDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleModerateAction = async (submissionIdToModerate: string, newStatus: string, reason?: string, isConfirmedDuplicateOfId?: string) => {
    setDetailsError(null); 
    try {
      const payload: { status: string; rejectionReason?: string; duplicateOfId?: string } = { status: newStatus };
      if (newStatus === MODERATION_STATUS.REJECTED) {
        payload.rejectionReason = reason;
        if (isConfirmedDuplicateOfId) payload.duplicateOfId = isConfirmedDuplicateOfId;
      }
      await axios.patch(`/api/submissions/${submissionIdToModerate}/moderate`, payload);
      await fetchSubmissionsList(); 
      if (selectedSubmissionId === submissionIdToModerate) {
        setSelectedSubmissionId(null); setSubmissionDetails(null);
      }
      setCustomRejectionReason('');
    } catch (err) { 
      let errorMessage = "Could not update submission.";
      if (axios.isAxiosError(err)) {
        const serverError = err as AxiosError<ApiErrorResponse>;
        errorMessage = serverError.response?.data?.message || serverError.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error("[FE Dashboard] Failed to moderate submission:", err);
      setDetailsError(`Moderation failed: ${errorMessage}`);
    }
  };
  
  const getStatusClassName = (status?: string): string => {
    if (!status) return styles.statusText;
    switch (status.toLowerCase()) {
      case 'pending': case 'pending moderation': return `${styles.statusText} ${styles.statusPending}`;
      case 'accepted': return `${styles.statusText} ${styles.statusAccepted}`;
      case 'rejected': return `${styles.statusText} ${styles.statusRejected}`;
      default: return styles.statusText; 
    }
  };

  const handleViewChange = (view: SubmissionListView) => {
    setCurrentListView(view); setCurrentPage(1); 
    setSelectedSubmissionId(null); setSubmissionDetails(null);
    setListError(null); setDetailsError(null); 
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      setSelectedSubmissionId(null); setSubmissionDetails(null);
    }
  };

  if (authIsLoading || (!authIsLoading && userRole !== 'moderator')) {
    return <div className={styles.loadingText}>Loading or checking authorization...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.pageTitle}>Moderator Dashboard</h1>
      
      <div className={styles.tabsContainer}>
        {(['pending', 'accepted', 'rejected'] as SubmissionListView[]).map(view => (
          <button 
            key={view}
            onClick={() => handleViewChange(view)}
            className={`${styles.tabButton} ${currentListView === view ? styles.activeTab : ''} 
                        ${currentListView === view && view === 'pending' ? styles.pendingActive : ''}
                        ${currentListView === view && view === 'accepted' ? styles.acceptedActive : ''}
                        ${currentListView === view && view === 'rejected' ? styles.rejectedActive : ''}`}
            disabled={isLoadingListedSubmissions && currentListView !== view}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)} 
            {currentListView === view && !isLoadingListedSubmissions ? ` (${totalItems})` : ''}
          </button>
        ))}
      </div>

      <div className={styles.paginationContainer}>
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoadingListedSubmissions} className={styles.paginationButton}>Previous</button>
        <span className={styles.pageInfo}> Page {currentPage} of {totalPages} ({totalItems} total items) </span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoadingListedSubmissions} className={styles.paginationButton}>Next</button>
      </div>

      {isLoadingListedSubmissions && <p className={styles.loadingText}>Loading {currentListView} submissions...</p>}
      {listError && !isLoadingListedSubmissions && <p className={styles.errorText}>{listError}</p>}
      {!isLoadingListedSubmissions && listedSubmissions.length === 0 && !listError && (
        <p className={styles.noSubmissionsText}>No {currentListView} submissions found.</p>
      )}

      {!isLoadingListedSubmissions && listedSubmissions.map((submission) => (
        <div key={submission._id} className={styles.submissionCard}>
          <h3 className={styles.submissionTitle}>{submission.title || 'No Title Provided'}</h3>
          <p className={styles.detailText}><strong>Authors:</strong> {submission.authors?.join(', ') || 'N/A'}</p>
          <p className={styles.detailText}><strong>Journal:</strong> {submission.journal || 'N/A'} | <strong>Year:</strong> {submission.year || 'N/A'}</p>
          {submission.doi && ( <p className={styles.detailText}><strong>DOI:</strong>{' '} <a href={`https://doi.org/${submission.doi}`} target="_blank" rel="noopener noreferrer" className={styles.doiLink}>{submission.doi}</a></p> )}
          <p className={styles.detailText}><strong>Submitted:</strong> {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : 'N/A'}</p>
          <p className={styles.detailText}><strong>Status:</strong> <span className={getStatusClassName(submission.status)}>{submission.status}</span></p>
          {submission.status.toLowerCase() === 'rejected' && submission.rejectionReason && (
            <p className={`${styles.detailText} ${styles.rejectionReasonText}`}><strong>Rejection Reason:</strong> {submission.rejectionReason}</p>
          )}

          {selectedSubmissionId === submission._id ? (
            <div className={styles.moderationSection}>
              <h4>Actions for: "{submissionDetails?.submission?.title || submission.title}"</h4>
              {isLoadingDetails && <p className={styles.loadingText}>Loading details & checking for duplicates...</p>}
              {detailsError && <p className={styles.errorText}>{detailsError}</p>}
              {submissionDetails && !isLoadingDetails && !detailsError && (
                <>
                  {submissionDetails.potentialDuplicates?.length > 0 && (
                    <div className={styles.duplicatesContainer}>
                      <h4>Potential Duplicates Found:</h4>
                      {submissionDetails.potentialDuplicates.map((dup, index) => (
                        <div key={dup._id} className={`${styles.duplicateItem} ${index === submissionDetails.potentialDuplicates.length - 1 ? styles.duplicateItemLast : ''}`}>
                          <p className={styles.detailText}><strong>Title:</strong> {dup.title || 'N/A'} (<span className={getStatusClassName(dup.status)}>{dup.status}</span>)
                            {typeof dup.similarityScore === 'number' && <em style={{marginLeft: '10px'}}>(Similarity: {(dup.similarityScore * 100).toFixed(0)}%)</em>}
                          </p>
                          {dup.doi && <p className={styles.detailText}><strong>DOI:</strong> <a href={`https://doi.org/${dup.doi}`} target="_blank" rel="noopener noreferrer" className={styles.doiLink}>{dup.doi}</a></p>}
                          <button onClick={() => handleModerateAction( submissionDetails.submission._id, MODERATION_STATUS.REJECTED, `Duplicate of: "${dup.title?.substring(0,30)}..." (ID: ${dup._id})`, dup._id )} className={`${styles.actionButton} ${styles.confirmDuplicateButton}`}>Confirm as Duplicate</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {submissionDetails.submission.status.toLowerCase() === 'pending' && (
                    <>
                      <div style={{ marginTop: '25px' }}>
                        <button onClick={() => handleModerateAction(submission._id, MODERATION_STATUS.ACCEPTED)} className={`${styles.actionButton} ${styles.acceptButton}`}>Accept Submission</button>
                      </div>
                      <div style={{marginTop: '25px'}}>
                        <h5>Reject Submission:</h5>
                        <button onClick={() => handleModerateAction(submission._id, MODERATION_STATUS.REJECTED, "Duplicate Submission (General)")} className={`${styles.actionButton} ${styles.rejectButton}`}>Reject (General Duplicate)</button>
                        {OTHER_REJECTION_REASONS_LIST.map(reason => (
                          <button key={reason} onClick={() => handleModerateAction(submission._id, MODERATION_STATUS.REJECTED, reason)} className={`${styles.actionButton} ${styles.rejectButton}`}>{reason}</button>
                        ))}
                        <div className={styles.rejectCustomButtonContainer}>
                          <input type="text" value={customRejectionReason} onChange={(e) => setCustomRejectionReason(e.target.value)} placeholder="Or type custom reason..." className={styles.inputField} />
                          <button onClick={() => handleModerateAction(submission._id, MODERATION_STATUS.REJECTED, customRejectionReason || "Other (moderator specified)")} disabled={!customRejectionReason.trim()} className={`${styles.actionButton} ${styles.rejectButton}`}>Reject (Custom)</button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
               <button onClick={() => {setSelectedSubmissionId(null); setSubmissionDetails(null); setDetailsError(null);}} className={`${styles.actionButton} ${styles.cancelButton}`}>Close Details</button>
            </div>
          ) : (
            <button onClick={() => handleSelectSubmissionForModeration(submission._id)} className={`${styles.actionButton} ${submission.status.toLowerCase() === 'pending' ? styles.moderateButton : styles.cancelButton}`} >
              {submission.status.toLowerCase() === 'pending' ? 'Moderate this Submission' : 'View Details'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ModeratorDashboard;