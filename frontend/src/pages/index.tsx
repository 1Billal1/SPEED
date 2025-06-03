import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import styles from '../styles/home.module.css';

interface Article {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi: string;
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      console.warn('Search query is empty.');
      return;
    }
  
    setLoading(true);
    setError('');
    setResults([]);
    console.log('Sending search request for query:', query);
  
    try {
      const res = await axios.get<Article[]>(`http://localhost:3001/api/submissions/search?query=${encodeURIComponent(query)}`);
  
      console.log('Response status:', res.status);
      console.log('Response data:', res.data);
  
      if (!Array.isArray(res.data)) {
        throw new Error('Expected an array of results but got: ' + JSON.stringify(res.data));
      }
  
      setResults(res.data || []);
    } catch (err) {
      console.error('Search error:', err);
  
      const axiosErr = err as AxiosError<{ message?: string }>;
  
      if (axiosErr.response) {
        setError(`Server Error: ${axiosErr.response.status} - ${axiosErr.response.data?.message || 'Unknown error'}`);
      } else if (axiosErr.request) {
        setError('No response from server. Is the backend running?');
      } else {
        setError('Search failed. ' + axiosErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Search Articles</h1>

      <div className={styles.searchBox}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter title, author, journal..."
          className={styles.input}
        />
        <button onClick={handleSearch} className={styles.button}>
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.results}>
        {results.length > 0 ? (
          results.map((article, index) => (
            <div key={index} className={styles.card}>
              <h2 className={styles.articleTitle}>{article.title}</h2>
              <p><strong>Authors:</strong> {article.authors.join(', ')}</p>
              <p><strong>Journal:</strong> {article.journal}</p>
              <p><strong>Year:</strong> {article.year}</p>
              <p>
                <strong>DOI:</strong>{' '}
                <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer">
                  {article.doi}
                </a>
              </p>
            </div>
          ))
        ) : (
          !loading && <p>No results found.</p>
        )}
      </div>
    </div>
  );
}
