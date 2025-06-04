// frontend/src/pages/analyst/dashboard.tsx
import { useEffect, useState, useCallback, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import styles from './dashboard.module.css';

// --- Types ---
interface FrontendSubmission {
  _id: string;
  title?: string;
  authors?: string[];
  authorRaw?: string;
  journal?: string;
  booktitle?: string;
  publisher?: string;
  year?: number;
  doi?: string;
  url?: string;
  volume?: string;
  number?: string;
  pages?: string;
  abstract?: string;
  bibtexEntryType?: string;
  rawBibtex?: string;
  status: string;
  extractedText?: string;
  createdAt?: string;
}

enum EvidenceResultEnum {
  SUPPORTS = 'Supports Claim',
  REFUTES = 'Refutes Claim',
  INCONCLUSIVE = 'Inconclusive/Mixed',
}

enum ResearchTypeEnum {
  CASE_STUDY = 'Case Study',
  EXPERIMENT = 'Experiment',
  SURVEY = 'Survey',
  LIT_REVIEW = 'Literature Review',
  OTHER = 'Other',
}

enum ParticipantTypeEnum {
  STUDENTS = 'Students',
  PROFESSIONALS = 'Professionals',
  MIXED = 'Mixed',
  NA = 'Not Applicable',
}

interface EvidenceFormData {
  sePractice: string;
  claim: string;
  resultOfEvidence: EvidenceResultEnum | '';
  typeOfResearch?: ResearchTypeEnum | '';
  typeOfParticipants?: ParticipantTypeEnum | '';
  strengthOfEvidence?: string;
  analystNotes?: string;
}

interface FullAnalysisPayload extends EvidenceFormData {
  submissionId: string;
  extractedText?: string;
}

interface PaginatedAnalystQueueResponse {
  submissions: FrontendSubmission[];
  total: number;
  currentPage: number;
  totalPages: number;
}

interface ApiErrorResponse {
  message: string;
  details?: unknown;
}

const ITEMS_PER_PAGE_ANALYST = 10;
const SE_PRACTICE_OPTIONS = ["Test-Driven Development", "Pair Programming", "Agile Methodologies", "Continuous Integration", "Code Review", "Microservices", "Static Analysis", "Requirements Engineering"];
const CLAIM_OPTIONS = ["Improves code quality", "Reduces bug count", "Increases development velocity", "Improves team morale", "Enhances maintainability", "Reduces development cost"];
const STRENGTH_OPTIONS = ["", "Strong", "Moderate", "Weak", "Not Applicable"];

const AnalystDashboard = () => {
  const { userRole, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  const [articlesToAnalyze, setArticlesToAnalyze] = useState<FrontendSubmission[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState<FrontendSubmission | null>(null);
  const [evidenceForm, setEvidenceForm] = useState<EvidenceFormData>({
    sePractice: '',
    claim: '',
    resultOfEvidence: '',
    typeOfResearch: '',
    typeOfParticipants: '',
    strengthOfEvidence: '',
    analystNotes: '',
  });
  const [extractedTextForm, setExtractedTextForm] = useState('');
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authIsLoading && userRole !== 'analyst') {
      router.replace(userRole ? '/' : '/auth/login');
    }
  }, [userRole, authIsLoading, router]);

  const fetchArticlesForAnalysis = useCallback(async () => {
    if (userRole !== 'analyst' || authIsLoading) return;
    
    setIsLoadingQueue(true);
    setQueueError(null);
    
    try {
      const response = await axios.get<PaginatedAnalystQueueResponse>('/api/submissions/find-by-status', {
        params: { status: 'accepted', page: currentPage, limit: ITEMS_PER_PAGE_ANALYST }
      });
      
      if (response.data && Array.isArray(response.data.submissions)) {
        setArticlesToAnalyze(response.data.submissions);
        setTotalPages(response.data.totalPages);
        setTotalItems(response.data.total);
        setCurrentPage(response.data.currentPage);
      } else {
        setQueueError("Received invalid data for analysis queue.");
        setArticlesToAnalyze([]);
      }
    } catch (err: unknown) {
      let msg = "Failed to load articles for analysis.";
      if (axios.isAxiosError(err)) {
        const serverError = err as AxiosError<ApiErrorResponse>;
        msg = serverError.response?.data?.message || serverError.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setQueueError(msg);
      setArticlesToAnalyze([]);
    } finally {
      setIsLoadingQueue(false);
    }
  }, [userRole, authIsLoading, currentPage]);

  useEffect(() => {
    fetchArticlesForAnalysis();
  }, [fetchArticlesForAnalysis]);

  const handleSelectArticle = (submission: FrontendSubmission) => {
    setSelectedSubmission(submission);
    setExtractedTextForm(submission.extractedText || submission.abstract || '');
    setEvidenceForm({
      sePractice: '',
      claim: '',
      resultOfEvidence: '',
      typeOfResearch: '',
      typeOfParticipants: '',
      strengthOfEvidence: '',
      analystNotes: '',
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleEvidenceFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEvidenceForm(prev => ({ ...prev, [name]: value }));
  };

  const handleExtractedTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setExtractedTextForm(e.target.value);
  };

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    
    setFormError(null);
    setFormSuccess(null);
    setIsSubmittingEvidence(true);

    if (!evidenceForm.sePractice || !evidenceForm.claim || !evidenceForm.resultOfEvidence) {
      setFormError("SE Practice, Claim, and Result of Evidence are required for the evidence entry.");
      setIsSubmittingEvidence(false);
      return;
    }

    try {
      const payload: FullAnalysisPayload = {
        ...evidenceForm,
        submissionId: selectedSubmission._id,
        extractedText: extractedTextForm.trim(),
      };

      await axios.post('/api/evidence-entries/create', payload);
      setFormSuccess(`Analysis for "${selectedSubmission.title}" saved successfully!`);
      setSelectedSubmission(null);
      await fetchArticlesForAnalysis();
    } catch (err: unknown) {
      let msg = "Failed to save analysis.";
      if (axios.isAxiosError(err)) {
        const serverError = err as AxiosError<ApiErrorResponse>;
        msg = serverError.response?.data?.message || serverError.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setFormError(msg);
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      setSelectedSubmission(null);
    }
  };

  if (authIsLoading || (!authIsLoading && userRole !== 'analyst')) {
    return <div className={styles.loadingText}>Loading or checking authorization...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.pageTitle}>Analyst Dashboard - Article Analysis</h1>

      {formSuccess && <p className={styles.successText}>{formSuccess}</p>}
      {formError && !formSuccess && <p className={styles.errorTextSmall}>{formError}</p>}

      {!selectedSubmission ? (
        <>
          <h2>Articles Awaiting Analysis ({totalItems})</h2>
          {isLoadingQueue && <p className={styles.loadingText}>Loading articles...</p>}
          {queueError && <p className={styles.errorText}>{queueError}</p>}
          {!isLoadingQueue && articlesToAnalyze.length === 0 && !queueError && (
            <p className={styles.noItemsText}>No articles currently accepted and awaiting analysis.</p>
          )}
          {articlesToAnalyze.map(sub => (
            <div key={sub._id} className={styles.submissionItem}>
              <h3 className={styles.itemTitle}>{sub.title || "Untitled"}</h3>
              <p><strong>Authors:</strong> {sub.authors?.join(', ') || sub.authorRaw || 'N/A'}</p>
              <p><strong>Journal/Venue:</strong> {sub.journal || sub.booktitle || 'N/A'}</p>
              <p><strong>Year:</strong> {sub.year || 'N/A'}</p>
              <p><strong>Status:</strong> <span className={styles.statusAccepted}>{sub.status}</span></p>
              <button onClick={() => handleSelectArticle(sub)} className={styles.actionButton}>
                Analyze This Article
              </button>
            </div>
          ))}
          {!isLoadingQueue && articlesToAnalyze.length > 0 && totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1} 
                className={styles.paginationButton}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages} 
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.analysisFormContainer}>
          <button 
            onClick={() => setSelectedSubmission(null)} 
            className={`${styles.actionButton} ${styles.backButton}`}
          >
            ← Back to Queue
          </button>

          <h2>Analyzing: {selectedSubmission.title || 'Untitled'}</h2>

          <div className={styles.bibliographicDetails}>
            <h4>Bibliographic Details:</h4>
            <p><strong>Type:</strong> {selectedSubmission.bibtexEntryType || 'N/A'}</p>
            <p><strong>Authors:</strong> {selectedSubmission.authors?.join('; ') || selectedSubmission.authorRaw || 'N/A'}</p>
            <p><strong>Year:</strong> {selectedSubmission.year || 'N/A'}</p>
            {selectedSubmission.journal && <p><strong>Journal:</strong> {selectedSubmission.journal}</p>}
            {selectedSubmission.booktitle && <p><strong>Book/Conference Title:</strong> {selectedSubmission.booktitle}</p>}
            {selectedSubmission.publisher && <p><strong>Publisher:</strong> {selectedSubmission.publisher}</p>}
            {selectedSubmission.doi && (
              <p>
                <strong>DOI:</strong> 
                <a 
                  href={`https://doi.org/${selectedSubmission.doi}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.doiLink}
                >
                  {selectedSubmission.doi}
                </a>
              </p>
            )}
            {selectedSubmission.url && (
              <p>
                <strong>URL:</strong> 
                <a 
                  href={selectedSubmission.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.doiLink}
                >
                  Access Link
                </a>
              </p>
            )}
            {selectedSubmission.volume && <p><strong>Volume:</strong> {selectedSubmission.volume}</p>}
            {selectedSubmission.number && <p><strong>Issue:</strong> {selectedSubmission.number}</p>}
            {selectedSubmission.pages && <p><strong>Pages:</strong> {selectedSubmission.pages}</p>}
            {selectedSubmission.abstract && (
              <div>
                <strong>Abstract:</strong> 
                <pre className={styles.abstractText}>{selectedSubmission.abstract}</pre>
              </div>
            )}
            {selectedSubmission.rawBibtex && (
              <div>
                <button 
                  onClick={() => alert(selectedSubmission.rawBibtex)} 
                  className={`${styles.actionButton} ${styles.bibtexButton}`}
                >
                  Show BibTeX
                </button>
              </div>
            )}
          </div>

          <h4 className={styles.formSectionTitle}>Enter Evidence Details:</h4>
          <form onSubmit={handleFormSubmit} className={styles.evidenceForm}>
            <div className={styles.formGroup}>
              <label htmlFor="sePractice">SE Practice:</label>
              <select
                name="sePractice"
                id="sePractice"
                value={evidenceForm.sePractice}
                onChange={handleEvidenceFormChange}
                required
                className={styles.selectInput}
              >
                <option value="" disabled>Select SE Practice...</option>
                {SE_PRACTICE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="claim">Claim associated with SE Practice:</label>
              <select
                name="claim"
                id="claim"
                value={evidenceForm.claim}
                onChange={handleEvidenceFormChange}
                required
                className={styles.selectInput}
              >
                <option value="" disabled>Select Claim...</option>
                {CLAIM_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="resultOfEvidence">Result of Evidence regarding Claim:</label>
              <select
                name="resultOfEvidence"
                id="resultOfEvidence"
                value={evidenceForm.resultOfEvidence}
                onChange={handleEvidenceFormChange}
                required
                className={styles.selectInput}
              >
                <option value="" disabled>Select Result...</option>
                {Object.values(EvidenceResultEnum).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="extractedText">Extracted Text (e.g., Abstract, Key Sections for Evidence):</label>
              <textarea
                name="extractedText"
                id="extractedText"
                value={extractedTextForm}
                onChange={handleExtractedTextChange}
                rows={8}
                className={styles.textareaLarge}
                placeholder="Copy relevant text here that supports the claim/result..."
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="typeOfResearch">Type of Research (Optional):</label>
              <select
                name="typeOfResearch"
                id="typeOfResearch"
                value={evidenceForm.typeOfResearch}
                onChange={handleEvidenceFormChange}
                className={styles.selectInput}
              >
                <option value="">-- Select Type --</option>
                {Object.values(ResearchTypeEnum).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="typeOfParticipants">Type of Participants (Optional):</label>
              <select
                name="typeOfParticipants"
                id="typeOfParticipants"
                value={evidenceForm.typeOfParticipants}
                onChange={handleEvidenceFormChange}
                className={styles.selectInput}
              >
                <option value="">-- Select Participants --</option>
                {Object.values(ParticipantTypeEnum).map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="strengthOfEvidence">Strength of Evidence (Optional):</label>
              <select
                name="strengthOfEvidence"
                id="strengthOfEvidence"
                value={evidenceForm.strengthOfEvidence}
                onChange={handleEvidenceFormChange}
                className={styles.selectInput}
              >
                {STRENGTH_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt || '-- Select Strength --'}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="analystNotes">Analyst Notes (Optional):</label>
              <textarea
                name="analystNotes"
                id="analystNotes"
                value={evidenceForm.analystNotes}
                onChange={handleEvidenceFormChange}
                rows={3}
                className={styles.textareaSmall}
                placeholder="Your brief notes or context..."
              />
            </div>

            {formError && <p className={`${styles.errorText} ${styles.errorTextSmall}`}>{formError}</p>}
            <button
              type="submit"
              className={`${styles.actionButton} ${styles.saveButton}`}
              disabled={isSubmittingEvidence}
            >
              {isSubmittingEvidence ? 'Saving...' : 'Save Evidence'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AnalystDashboard;