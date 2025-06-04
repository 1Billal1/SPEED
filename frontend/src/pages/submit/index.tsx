// frontend/src/pages/submit/index.tsx
import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import axios, { AxiosError } from 'axios'; // Ensure AxiosError is imported if used for casting
import styles from './submit.module.css'; // Ensure this path is correct

// Define what your /api/parse-bibtex endpoint returns
interface ParsedBibtexData {
  title?: string;
  authors?: string[]; // This is an array from backend
  journal?: string;   // Or booktitle, etc.
  year?: number;
  doi?: string;
  volume?: string;
  number?: string;    // Issue number
  pages?: string;
  publisher?: string;
  bibtexEntryType?: string; // Important for backend
  rawBibtex?: string;       // Important for backend
  authorRaw?: string;       // Important for backend
}

// Define a common error structure from your APIs
interface ApiErrorResponse {
  message: string;
  details?: unknown;
}

export default function SubmitPage() {
  const [formData, setFormData] = useState({
    title: '',
    authors: '', // Keep as string for form input, convert to array on submit
    journal: '', // This field can serve for journal or booktitle depending on context
    year: '',
    doi: '',
    volume: '',
    number: '', // For issue number
    pages: '',
    publisher: '',
    // Fields that will be populated by bibtex parser but not directly editable in this simplified form
    bibtexEntryType: '', 
    rawBibtex: '',
    authorRaw: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setSuccessMessage('');
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File read error: content is not a string.');
        }

        // Call your Next.js API route for parsing
        const response = await fetch('/api/parse-bibtex', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bibtex: text }),
        });

        const parsedData: ParsedBibtexData = await response.json();

        if (!response.ok) {
          const errorData = parsedData as ApiErrorResponse;
          throw new Error(errorData.message || 'Failed to parse BibTeX on server.');
        }

        setFormData({
          title: parsedData.title || '',
          authors: Array.isArray(parsedData.authors) ? parsedData.authors.join(', ') : '',
          journal: parsedData.journal || '', 
          year: parsedData.year ? String(parsedData.year) : '',
          doi: parsedData.doi || '',
          volume: parsedData.volume || '',
          number: parsedData.number || '',
          pages: parsedData.pages || '',
          publisher: parsedData.publisher || '',
          bibtexEntryType: parsedData.bibtexEntryType || '',
          rawBibtex: parsedData.rawBibtex || text,
          authorRaw: parsedData.authorRaw || (Array.isArray(parsedData.authors) ? parsedData.authors.join(' and ') : ''),
        });
        setSuccessMessage('Fields auto-filled from BibTeX file.');
      } catch (err: unknown) {
        let msg = 'Error processing BibTeX file.';
        if (err instanceof Error) msg = err.message;
        setErrorMessage(msg);
        console.error("Bibtex processing error:", err);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = {
        title: formData.title,
        authors: formData.authors.split(',').map(a => a.trim()).filter(a => a), // Ensure no empty strings
        journal: formData.journal, // This can be journal or booktitle
        year: Number(formData.year), // Convert to number
        doi: formData.doi,
        volume: formData.volume || undefined, // Send undefined if empty
        number: formData.number || undefined,
        pages: formData.pages || undefined,
        publisher: formData.publisher || undefined,
        // These should come from the bibtex parse or be determined by backend if not directly from form
        bibtexEntryType: formData.bibtexEntryType || 'MISC', // Default if not parsed
        rawBibtex: formData.rawBibtex || undefined,
        authorRaw: formData.authorRaw || formData.authors,
        // Add abstract if you have an input for it: abstract: formData.abstract || undefined,
      };

      if (!payload.title || payload.authors.length === 0 || !payload.journal || !payload.year || !payload.doi) {
          setErrorMessage('Please fill in all required fields (Title, Authors, Journal/Conference, Year, DOI).');
          setIsSubmitting(false);
          return;
      }


      // POST to your Next.js API route that proxies to the backend submission creation
      await axios.post('/api/submissions', payload);

      setSuccessMessage('Article submitted successfully!');
      setFormData({ 
          title: '', authors: '', journal: '', year: '', doi: '',
          volume: '', number: '', pages: '', publisher: '',
          bibtexEntryType: '', rawBibtex: '', authorRaw: ''
      });
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input

    } catch (error: unknown) {
      let msg = 'Submission failed. Please check all fields and try again.';
      if (axios.isAxiosError(error)) {
        const serverError = error as AxiosError<ApiErrorResponse>; // Use your defined ApiErrorResponse
        msg = serverError.response?.data?.message || serverError.message || msg;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      console.error('Submission error:', error);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Submit New Article Evidence</h1>

      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
      {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Bibliographic Details</h2>
            <p className={styles.hint}>
                You can auto-fill these fields by uploading a .bib BibTeX file below.
            </p>
        </div>

        <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>Title <span className={styles.required}>*</span></label>
            <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} className={styles.input} required />
        </div>

        <div className={styles.formGroup}>
            <label htmlFor="authors" className={styles.label}>Authors (comma-separated) <span className={styles.required}>*</span></label>
            <input type="text" name="authors" id="authors" value={formData.authors} onChange={handleChange} className={styles.input} required />
        </div>

        <div className={styles.formGroup}>
            <label htmlFor="journal" className={styles.label}>Journal / Conference / Book Title <span className={styles.required}>*</span></label>
            <input type="text" name="journal" id="journal" value={formData.journal} onChange={handleChange} className={styles.input} required placeholder="e.g., TSE, ICSE, Name of Book" />
        </div>
        
        <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label htmlFor="year" className={styles.label}>Year <span className={styles.required}>*</span></label>
                <input type="number" name="year" id="year" value={formData.year} onChange={handleChange} min="1900" max={new Date().getFullYear() + 1} className={styles.input} required />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="doi" className={styles.label}>DOI <span className={styles.required}>*</span></label>
                <input type="text" name="doi" id="doi" value={formData.doi} onChange={handleChange} placeholder="e.g., 10.xxxx/xxxxx" className={styles.input} required />
            </div>
        </div>

        <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label htmlFor="volume" className={styles.label}>Volume</label>
                <input type="text" name="volume" id="volume" value={formData.volume} onChange={handleChange} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="number" className={styles.label}>Number / Issue</label>
                <input type="text" name="number" id="number" value={formData.number} onChange={handleChange} className={styles.input} />
            </div>
        </div>

        <div className={styles.formGroup}>
            <label htmlFor="pages" className={styles.label}>Pages</label>
            <input type="text" name="pages" id="pages" value={formData.pages} onChange={handleChange} placeholder="e.g., 1-10 or 123" className={styles.input} />
        </div>

        <div className={styles.formGroup}>
            <label htmlFor="publisher" className={styles.label}>Publisher</label>
            <input type="text" name="publisher" id="publisher" value={formData.publisher} onChange={handleChange} className={styles.input} />
        </div>
        
        <div className={styles.formGroup} style={{marginTop: '2rem', borderTop: '1px dashed #ccc', paddingTop: '1rem'}}>
            <label htmlFor="bibtexFile" className={styles.label}>Upload BibTeX File (Optional)</label>
            <input type="file" id="bibtexFile" accept=".bib,.txt" onChange={handleFileChange} ref={fileInputRef} className={styles.fileInput} />
            <p className={styles.hint}>Upload a .bib file to attempt auto-filling the fields above.</p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`${styles.button} ${isSubmitting ? styles.disabled : ''}`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Article'}
        </button>
      </form>
    </div>
  );
}