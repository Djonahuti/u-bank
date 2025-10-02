
import { NextResponse } from 'next/server';
import { dwollaClient } from '@/lib/dwolla';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { amount, funding_source_url, customer_id, description } = await request.json();

  try {
    const transferRequest = {
      _links: {
        source: { href: funding_source_url },
        destination: { href: process.env.NEXT_DWOLLA_DESTINATION_FUNDING_SOURCE_URL as string },
      },
      amount: { currency: 'USD', value: String(amount) },
    };

    const transfer = await dwollaClient.post('transfers', transferRequest);

    await supabase.from('transactions').insert({
      customer_id,
      // Optionally, you can store the funding_source_url or bank_id if needed
      amount,
      transaction_type: 'transfer',
      description,
      status: 'pending',
      dwolla_transaction_id: transfer.headers.get('location'),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message = error?.message || 'Failed to process transfer';
    const details = error?.body || error;
    console.error('Transfer API error:', details);
    return NextResponse.json({ error: message, details }, { status: 500 });
  }
}