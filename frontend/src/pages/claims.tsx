import React, { useState } from 'react';
import ClaimList from '../components/claims/ClaimList';
import ClaimDetails from '../components/claims/ClaimDetails';

const ClaimsPage: React.FC = () => {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', padding: '20px', gap: '40px' }}>
      <div style={{ flex: 1 }}>
        <h1>Claims</h1>
        <ClaimList onSelect={setSelectedClaimId} />
      </div>
      <div style={{ flex: 2 }}>
        {selectedClaimId ? (
          <ClaimDetails claimId={selectedClaimId} />
        ) : (
          <p>Please select a claim to view details.</p>
        )}
      </div>
    </div>
  );
};

export default ClaimsPage;
