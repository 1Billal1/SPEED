import React, { useEffect, useState } from 'react';

interface Claim {
  _id: string;
  title: string;
  description: string;
}

interface ClaimListProps {
  onSelect: (id: string) => void;
}

const ClaimList: React.FC<ClaimListProps> = ({ onSelect }) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      setError('API base URL is not defined in NEXT_PUBLIC_API_URL');
      setLoading(false);
      return;
    }

    const fullUrl = `${apiUrl}/claims`;
    console.log('Fetching claims from:', fullUrl);

    fetch(fullUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setClaims(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch claims:', err);
        setError('Failed to fetch claims. Check API URL or server status.');
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading claims...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <ul>
      {claims.map(claim => (
        <li
          key={claim._id}
          onClick={() => onSelect(claim._id)}
          style={{ cursor: 'pointer', marginBottom: '10px' }}
        >
          <strong>{claim.title}</strong><br />
          <small>{claim.description.slice(0, 80)}...</small>
        </li>
      ))}
    </ul>
  );
};

export default ClaimList;
