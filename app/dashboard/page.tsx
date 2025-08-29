'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PlaidLink } from '@/components/PlaidLink';
import { TransactionChart } from '@/components/TransactionChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bank, Transaction } from '@/types';
import { useAuth } from '@/components/AuthProvider';

export default function Dashboard() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (customer) {
          const { data: banksData } = await supabase
            .from('banks')
            .select('*')
            .eq('customer_id', customer.id);
          setBanks(banksData || []);

          const { data: transactionsData } = await supabase
            .from('transactions')
            .select('*')
            .eq('customer_id', customer.id);
          setTransactions(transactionsData || []);
        }
      };
      fetchData();
    }
  }, [user]);

  const handleTransfer = async (fundingSourceUrl: string) => {
    try {
      const customer = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      await fetch('/api/dwolla/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100, // Example amount
          funding_source_url: fundingSourceUrl,
          customer_id: customer.data?.id,
          description: 'Test transfer',
        }),
      });
      // Refresh transactions
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', customer.data?.id);
      setTransactions(data || []);
    } catch (error) {
      console.error('Transfer error:', error);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="flex justify-between items-center mb-4">
      <PlaidLink onSuccess={() => window.location.reload()} />
        <Button onClick={logout}>Logout</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            {banks.map(bank => (
              <div key={bank.id} className="mb-4">
                <h3>{bank.account_name}</h3>
                <p>Available: ${bank.balance.available}</p>
                <p>Current: ${bank.balance.current}</p>
                <Button onClick={() => handleTransfer(bank.funding_source_url)}>Transfer</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionChart transactions={transactions} />
            <div className="mt-4">
              {transactions.map(tx => (
                <div key={tx.id} className="mb-2">
                  <p>{tx.description} - ${tx.amount} ({tx.status})</p>
                  <p>{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}