import React, { useEffect, useState } from 'react';

interface Claim {
  _id: string;
  title: string;
  description: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
}

const ClaimDetails: React.FC<{ claimId: string | null }> = ({ claimId }) => {
  const [claim, setClaim] = useState<Claim | null>(null);

  useEffect(() => {
    if (!claimId) return;
    fetch(`http://localhost:3001/claims/${claimId}`)
      .then(res => res.json())
      .then(data => setClaim(data))
      .catch(err => console.error('Failed to fetch claim details:', err));
  }, [claimId]);

  if (!claimId) return <p>Select a claim to view details.</p>;
  if (!claim) return <p>Loading claim details...</p>;

  return (
    <div>
      <h2>{claim.title}</h2>
      <p>{claim.description}</p>

      <h3>Evidence For:</h3>
      <ul>{claim.evidenceFor.map((e, i) => <li key={i}>{e}</li>)}</ul>

      <h3>Evidence Against:</h3>
      <ul>{claim.evidenceAgainst.map((e, i) => <li key={i}>{e}</li>)}</ul>
    </div>
  );
};

export default ClaimDetails;
