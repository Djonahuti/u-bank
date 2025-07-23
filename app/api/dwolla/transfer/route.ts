import { NextResponse } from 'next/server';
import { dwollaClient } from '@/lib/dwolla';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { amount, bank_id, customer_id, description } = await request.json();

  try {
    const transferRequest = {
      _links: {
        source: { href: `${process.env.NEXT_DWOLLA_BASE_URL}/funding-sources/${bank_id}` },
        destination: { href: `${process.env.NEXT_DWOLLA_BASE_URL}/funding-sources/destination-id` },
      },
      amount: { currency: 'USD', value: amount },
    };

    const transfer = await dwollaClient.post('transfers', transferRequest);

    await supabase.from('transactions').insert({
      customer_id,
      bank_id,
      amount,
      transaction_type: 'transfer',
      description,
      status: 'pending',
      dwolla_transaction_id: transfer.headers.get('location'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process transfer' }, { status: 500 });
  }
}