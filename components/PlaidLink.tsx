'use client';

import { usePlaidLink } from 'react-plaid-link';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthProvider';

interface PlaidLinkProps {
  onSuccess: () => void;
}

export function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const [token, setToken] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const createLinkToken = async () => {
      const response = await fetch('/api/plaid/link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const { link_token } = await response.json();
      setToken(link_token);
    };

    if (user) createLinkToken();
  }, [user]);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess: async (public_token, metadata) => {
      await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token,
          account_id: metadata.accounts[0].id,
          account_name: metadata.accounts[0].name,
          userId: user?.id,
        }),
      });
      onSuccess();
    },
  });

  return (
    <Button onClick={() => open()} disabled={!ready}>
      Link Bank Account
    </Button>
  );
}