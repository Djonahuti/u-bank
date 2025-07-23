import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { public_token, account_id, account_name, userId } = await request.json();

  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = response.data.access_token;

    const accountsResponse = await plaidClient.accountsBalanceGet({
      access_token,
    });

    const balance = accountsResponse.data.accounts.find(acc => acc.account_id === account_id)?.balances;

    const { error } = await supabase
      .from('banks')
      .insert({
        customer_id: (await supabase.from('customers').select('id').eq('user_id', userId).single()).data?.id,
        plaid_access_token: access_token,
        account_id,
        account_name,
        balance,
      });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}