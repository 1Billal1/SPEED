import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import styles from './submit.module.css';

export default function SubmitPage() {
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    journal: '',
    year: '',
    doi: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File read error: not a string');
        }

        const response = await fetch('/api/parse-bibtex', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bibtex: text }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to parse BibTeX');
        }

        setFormData({
          title: data.title || '',
          authors: Array.isArray(data.authors) ? data.authors.join(', ') : '',
          journal: data.journal || '',
          year: data.year ? String(data.year) : '',
          doi: data.doi || '',
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          alert(`Error: ${err.message}`);
        }
      }
    };

    reader.readAsText(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    setError('');

    try {
      await axios.post('/api/submissions', {
        title: formData.title,
        authors: formData.authors.split(',').map(a => a.trim()),
        journal: formData.journal,
        year: Number(formData.year),
        doi: formData.doi
      });

      setSuccess(true);
      setFormData({ title: '', authors: '', journal: '', year: '', doi: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: unknown) {
      console.error('Submission error:', error);
      setError('Submission failed. Please check all fields and try again.');
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
      <h1 className={styles.heading}>Submit Article</h1>

      {success && (
        <div className={styles.success}>Article submitted successfully!</div>
      )}
      {error && (
        <div className={styles.error}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <label className={styles.label}>Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={styles.input}
          required
        />

        <label className={styles.label}>Authors</label>
        <input
          type="text"
          name="authors"
          value={formData.authors}
          onChange={handleChange}
          className={styles.input}
          required
        />

        <label className={styles.label}>Journal/Conference</label>
        <input
          type="text"
          name="journal"
          value={formData.journal}
          onChange={handleChange}
          className={styles.input}
          required
        />

        <label className={styles.label}>Year</label>
        <input
          type="number"
          name="year"
          value={formData.year}
          onChange={handleChange}
          min="1900"
          max={new Date().getFullYear()}
          className={styles.input}
          required
        />

        <label className={styles.label}>DOI</label>
        <input
          type="text"
          name="doi"
          value={formData.doi}
          onChange={handleChange}
          placeholder="10.xxxx/xxxxx"
          className={styles.input}
          required
        />

        <label className={styles.label}>BibTeX File (optional)</label>
        <input
          type="file"
          accept=".bib,.txt"
          onChange={handleFileChange}
          ref={fileInputRef}
          className={styles.input}
        />
        <p className={styles.hint}>
          Upload .bib file to auto-fill fields above
        </p>

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
