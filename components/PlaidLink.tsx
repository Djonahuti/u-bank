'use client';

import { usePlaidLink } from 'react-plaid-link';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useAuth } from './AuthProvider';

interface PlaidLinkProps {
  onSuccess: () => void;
}

export function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    const createLinkToken = async () => {
      if (!user) {
        setError('User not authenticated. Please sign in.');
        console.log('No user found, cannot fetch link token');
        return;
      }

      try {
        console.log('Fetching Plaid link token for user:', user.id);
        const response = await fetch('/api/plaid/link-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        if (!data.link_token) {
          throw new Error('No link token received from API');
        }

        console.log('Link token received:', data.link_token);
        setToken(data.link_token);
      } catch (err: unknown) {
        console.error('Error fetching link token:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Plaid link token';
        setError(errorMessage);
      }
    };

    if (user && !loading) {
      createLinkToken();
    } else {
      console.log('Waiting for user authentication, loading:', loading);
    }
  }, [user, loading]);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess: async (public_token, metadata) => {
      try {
        console.log('Plaid link success:', { public_token, metadata });
        const response = await fetch('/api/plaid/exchange-public-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_token,
            account_id: metadata.accounts[0]?.id,
            account_name: metadata.accounts[0]?.name,
            userId: user?.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        console.log('Public token exchanged successfully');
        onSuccess();
      } catch (err: unknown) {
        console.error('Error exchanging public token:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to exchange Plaid public token';
        setError(errorMessage);
      }
    },
    onExit: (err, metadata) => {
      if (err != null) {
        console.error('Plaid link exit error:', err, metadata);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError('Plaid link exited unexpectedly: ' + errorMessage);
      }
    },
  });

  return (
    <div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <Button onClick={() => {
        console.log('Button clicked, ready:', ready, 'token:', token);
        open();
      }} disabled={!ready || loading}>
        {loading ? 'Loading...' : ready ? 'Link Bank Account' : 'Waiting for Plaid...'}
      </Button>
    </div>
  );
}