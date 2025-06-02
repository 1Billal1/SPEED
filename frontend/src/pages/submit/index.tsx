import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

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

        console.log('Response status:', response.status);
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to parse BibTeX');
        }

        // ✅ Update form fields from parsed BibTeX
        setFormData({
          title: data.title || '',
          authors: Array.isArray(data.authors) ? data.authors.join(', ') : '',
          journal: data.journal || '',
          year: data.year ? String(data.year) : '',
          doi: data.doi || '',
        });
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Parsing failed:', err.message);
          alert(`Error: ${err.message}`);
        } else {
          console.error('Unexpected error:', err);
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Submit Article</h1>

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
          Article submitted successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Title*</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Authors* (comma separated)
          </label>
          <input
            type="text"
            name="authors"
            value={formData.authors}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Journal/Conference*</label>
          <input
            type="text"
            name="journal"
            value={formData.journal}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Year*</label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            min="1900"
            max={new Date().getFullYear()}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">DOI*</label>
          <input
            type="text"
            name="doi"
            value={formData.doi}
            onChange={handleChange}
            placeholder="10.xxxx/xxxxx"
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">BibTeX File (optional)</label>
          <input
            type="file"
            accept=".bib,.txt"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="w-full p-2 border border-gray-300 rounded"
          />
          <p className="text-sm text-gray-500 mt-1">
            Upload .bib file to auto-fill fields above
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 rounded text-white ${
            isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Article'}
        </button>
      </form>
    </div>
  );
}
