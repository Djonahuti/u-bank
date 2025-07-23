import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { CountryCode, Products } from 'plaid';

export async function POST(request: Request) {
  const { userId } = await request.json();

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'U-Bank',
      products: [Products.Auth, Products.Transactions, Products.Identity],
      country_codes: [CountryCode.Us, CountryCode.Ca, CountryCode.Gb],
      language: 'en',
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 });
  }
}