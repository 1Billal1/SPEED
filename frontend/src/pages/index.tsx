// frontend/src/pages/index.tsx
import { useState, FormEvent, useEffect, useCallback, ChangeEvent } from 'react';
import axios, { AxiosError } from 'axios';
import styles from '../styles/home.module.css';

// --- Interfaces (keep as they were) ---
interface SourceArticleDetails {
  _id: string; title?: string; authors?: string[]; authorRaw?: string;
  journal?: string; booktitle?: string; publisher?: string; year?: number;
  doi?: string; url?: string; bibtexEntryType?: string; rawBibtex?: string;   
  extractedText?: string;
}
interface EvidenceResultItem {
  _id: string; sePractice: string; claim: string; resultOfEvidence: string;
  typeOfResearch?: string; typeOfParticipants?: string; analystNotes?: string;
  submissionId: SourceArticleDetails | string; createdAt?: string;
}
interface EvidenceSearchResponse {
  evidence: EvidenceResultItem[]; total: number; currentPage: number; totalPages: number;
}
interface ApiErrorResponse { message: string; details?: unknown; }

const PREDEFINED_SE_PRACTICES: string[] = [ 
  "Test-Driven Development", "Pair Programming", "Agile Methodologies", 
  "Continuous Integration", "Code Review", "Microservices"
];
const ITEMS_PER_PAGE = 10;

export default function SEPracticeSearchPage() {
  const [keywords, setKeywords] = useState('');
  const [selectedPractice, setSelectedPractice] = useState('');
  const [results, setResults] = useState<EvidenceResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const performSearch = useCallback(async (pageToFetch: number = 1) => {
    if (!selectedPractice && !keywords.trim()) {
      setResults([]); setTotalItems(0); setTotalPages(1); return;
    }
    setIsLoading(true); setError(null); setCurrentPage(pageToFetch);
    try {
      const params: { page: number; limit: number; sePractice?: string; keywords?: string } = 
        { page: pageToFetch, limit: ITEMS_PER_PAGE };
      if (selectedPractice) params.sePractice = selectedPractice;
      if (keywords.trim()) params.keywords = keywords.trim();
      const response = await axios.get<EvidenceSearchResponse>(`/api/evidence/search`, { params });
      if (response.data && Array.isArray(response.data.evidence)) {
        setResults(response.data.evidence); setTotalItems(response.data.total);
        setTotalPages(response.data.totalPages);
      } else {
        setError("Received invalid data from search."); setResults([]);
        setTotalItems(0); setTotalPages(1);
      }
    } catch (err: unknown) {
      let errorMessage = 'Search failed.';
      if (axios.isAxiosError(err)) {
        const serverError = err as AxiosError<ApiErrorResponse>;
        errorMessage = serverError.response?.data?.message || serverError.message || errorMessage;
      } else if (err instanceof Error) { errorMessage = err.message; }
      setError(errorMessage); setResults([]); setTotalItems(0); setTotalPages(1);
    } finally { setIsLoading(false); }
  }, [selectedPractice, keywords]); 

  useEffect(() => {
    if (selectedPractice || keywords.trim() || currentPage !== 1) { 
      performSearch(currentPage);
    } else if (!selectedPractice && !keywords.trim() && currentPage === 1 && results.length > 0) {
      setResults([]); 
      setTotalItems(0); 
      setTotalPages(1);
    }
  }, [selectedPractice, keywords, currentPage, performSearch, results.length]); 

  const handleKeywordSubmit = (e: FormEvent<HTMLFormElement>) => { 
    e.preventDefault(); 
    setSelectedPractice(''); 
    if (currentPage !== 1) setCurrentPage(1); else performSearch(1); 
  };
  const handlePracticeChange = (e: ChangeEvent<HTMLSelectElement>) => { 
    setKeywords(''); 
    setSelectedPractice(e.target.value);
    setCurrentPage(1); 
  };
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) setCurrentPage(newPage); 
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Search SE Practice Evidence</h1>

      <form onSubmit={handleKeywordSubmit} className={styles.searchForm}>
        <div className={styles.keywordSearchRow}>
          <input
            type="text"
            id="keywordInput"
            value={keywords}
            onChange={(e) => {setKeywords(e.target.value); setSelectedPractice('');}}
            placeholder="Search keywords in SE Practice, Title, or Abstract..."
            className={styles.keywordInput}
          />
          <button 
            type="submit" 
            className={styles.searchButton} 
            disabled={isLoading || (!selectedPractice && !keywords.trim())}
          >
            {isLoading && keywords.trim() ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <div className={styles.filterGroup}>
            <label htmlFor="sePracticeSelect">Or Filter by SE Practice:</label>
            <select 
              id="sePracticeSelect" 
              value={selectedPractice} 
              onChange={handlePracticeChange} 
              className={styles.filterSelectInput} 
            >
                <option value="">-- All Practices --</option>
                {PREDEFINED_SE_PRACTICES.map(practice => ( <option key={practice} value={practice}>{practice}</option> ))}
            </select>
        </div>
      </form>

      <div className={styles.resultsInfo}>
        {isLoading && <p>Loading results...</p>}
        {error && <p className={styles.errorText}>{error}</p>}
        {!isLoading && !error && (selectedPractice || keywords.trim()) && (
            results.length > 0 ? <p>Found {totalItems} evidence entries.</p> : <p>No evidence found for your criteria.</p>
        )}
      </div>

      <div className={styles.resultsGrid}>
  {results.map((entry) => { 
    const submission = entry.submissionId && typeof entry.submissionId === 'object' 
      ? entry.submissionId as SourceArticleDetails 
      : null;
    return ( 
      <div key={entry._id} className={styles.resultCard}> 
        <h2 className={styles.articleTitle}>{submission?.title || 'Untitled Article'}</h2>
        
        <div className={styles.sePracticeDetails}>
          <h3 className={styles.evidenceSEPractice}>{entry.sePractice}</h3>
          <p><strong>Claim:</strong> {entry.claim}</p>
          <p><strong>Result:</strong> {entry.resultOfEvidence}</p>
          {entry.typeOfResearch && <p><strong>Research Type:</strong> {entry.typeOfResearch}</p>}
          {entry.typeOfParticipants && <p><strong>Participants:</strong> {entry.typeOfParticipants}</p>}
          {entry.analystNotes && <p className={styles.notes}><em>Notes: {entry.analystNotes}</em></p>}
        </div>
        
        {submission && ( 
          <div className={styles.sourceInfoContainer}> 
            <p><strong>Authors:</strong> {submission.authors?.join(', ') || submission.authorRaw || 'N/A'}</p>
            <p><strong>Published in:</strong> {submission.journal || submission.booktitle || 'N/A'} ({submission.year || 'N/A'})</p>
            {submission.doi && (
              <p><strong>DOI:</strong>{' '} 
                <a href={`https://doi.org/${submission.doi}`} target="_blank" rel="noopener noreferrer">
                  {submission.doi}
                </a>
              </p>
            )}
            {submission.url && (
              <p><strong>URL:</strong>{' '} 
                <a href={submission.url} target="_blank" rel="noopener noreferrer">
                  Access Link
                </a>
              </p>
            )}
            {submission.rawBibtex && 
              <button 
                onClick={() => alert(submission.rawBibtex)} 
                className={styles.bibtexButton}
              >
                Show BibTeX
              </button>
            }
            {submission.extractedText && ( 
              <div className={styles.extractedTextSnippet}> 
                <strong>Abstract/Snippet:</strong> 
                <p>{submission.extractedText.substring(0, 300)}{submission.extractedText.length > 300 ? '...' : ''}</p> 
              </div> 
            )} 
          </div> 
        )}
        {!submission && typeof entry.submissionId === 'string' && (
          <p><em>Source Article ID: {entry.submissionId}</em></p>
        )} 
      </div> 
    );
  })}
</div>

      {!isLoading && totalPages > 1 && ( 
        <div className={styles.paginationContainer}> 
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} className={styles.paginationButton}>Previous</button> 
          <span className={styles.pageInfo}> Page {currentPage} of {totalPages} </span> 
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading} className={styles.paginationButton}>Next</button> 
        </div> 
      )}
    </div>
  );
}