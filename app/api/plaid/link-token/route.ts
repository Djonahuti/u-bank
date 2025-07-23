import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      console.error('No userId provided in request');
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    console.log('Creating Plaid link token for userId:', userId);

    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'U-Bank',
      products: (process.env.NEXT_PLAID_PRODUCTS?.split(',') as any) || ['auth', 'transactions', 'identity'],
      country_codes: (process.env.NEXT_PLAID_COUNTRY_CODES?.split(',') as any) || ['US'],
      language: 'en',
    });

    console.log('Plaid link token created:', response.data.link_token);
    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error: any) {
    console.error('Error creating Plaid link token:', error);
    return NextResponse.json({ error: error.message || 'Failed to create link token' }, { status: 500 });
  }
}