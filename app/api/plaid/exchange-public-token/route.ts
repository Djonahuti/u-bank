
import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid';
import { supabase } from '@/lib/supabase';
import { dwollaClient } from '@/lib/dwolla';
import { ProcessorTokenCreateRequestProcessorEnum } from 'plaid';

export async function POST(request: Request) {
  const { public_token, account_id, account_name, userId, bank_name } = await request.json();

  try {
    // 1. Exchange public token for access token and item ID
    const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = exchangeRes.data.access_token;

    // 2. Get account info from Plaid
    const accountsRes = await plaidClient.accountsGet({ access_token });
    const account = accountsRes.data.accounts.find(acc => acc.account_id === account_id);
    if (!account) throw new Error('Account not found');

    // 3. Create processor token for Dwolla
    const processorRes = await plaidClient.processorTokenCreate({
      access_token,
      account_id,
      processor: ProcessorTokenCreateRequestProcessorEnum.Dwolla,
    });
    const processor_token = processorRes.data.processor_token;


    // 4. Get customer_id from Supabase, or create in Dwolla and Supabase if not found
    let dwolla_customer_id: string | null;
    let customerData;
    let customerError;
    {
      const res = await supabase
        .from('customers')
        .select('id, dwolla_customer_id, email, first_name, last_name, address, city, state, zip_code, date_of_birth, nin')
        .eq('user_id', userId)
        .single();
      customerData = res.data;
      customerError = res.error;
    }
    if (!customerData || customerError) {
      // Customer profile not found or incomplete
      throw new Error('Customer profile not completed. Please complete your profile before linking a bank account.');
    }

    const customer_id = customerData.id;
    dwolla_customer_id = customerData.dwolla_customer_id || null;

    // Validate state is a 2-letter US abbreviation
    const validStates = [
      'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
    ];
    if (!customerData.state || typeof customerData.state !== 'string' || !validStates.includes(customerData.state.toUpperCase())) {
      throw new Error('State must be a valid 2-letter US abbreviation (e.g., CA, NY, TX).');
    }
    customerData.state = customerData.state.toUpperCase();

    // Validate postalCode (zip_code)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!customerData.zip_code || !zipRegex.test(customerData.zip_code)) {
      throw new Error('Postal code must be a valid US ZIP code (e.g., 12345 or 12345-6789).');
    }

    // Validate ssn (nin)
    const ssnRegex = /^\d{9}$/;
    if (!customerData.nin || !ssnRegex.test(customerData.nin)) {
      throw new Error('SSN must be 9 digits (no dashes or spaces).');
    }

    // If no dwolla_customer_id, create in Dwolla and update customers table
    if (!dwolla_customer_id) {
      // Map your DB fields to Dwolla's required fields
      const dwollaPayload = {
        email: customerData.email,
        firstName: customerData.first_name,
        lastName: customerData.last_name,
        dateOfBirth: customerData.date_of_birth,
        address1: customerData.address,
        city: customerData.city,
        state: customerData.state,
        postalCode: customerData.zip_code,
        ssn: customerData.nin,
        type: 'personal',
      };
      const dwollaCustomerRes = await dwollaClient.post('customers', dwollaPayload);
      const dwollaLocation = dwollaCustomerRes.headers.get('location');
      if (!dwollaLocation) throw new Error('Failed to create Dwolla customer');
      dwolla_customer_id = dwollaLocation.split('/').pop() || '';
      // Save to customers table
      const { error: updateError } = await supabase
        .from('customers')
        .update({ dwolla_customer_id })
        .eq('id', customer_id);
      if (updateError) throw updateError;
    }


    // 5. Create funding source in Dwolla using dwolla_customer_id
    const fsRes = await dwollaClient.post(
      `customers/${dwolla_customer_id}/funding-sources`,
      {
        plaidToken: processor_token,
        name: bank_name || account_name || account.name || 'Bank Account',
      }
    );
    const fundingSourceUrl = fsRes.headers.get('location');

    // 6. Check if funding source URL exists
    if (fundingSourceUrl) {
      // 7. Create bank account in DB
      const { error: bankError } = await supabase.from('banks').insert({
        customer_id: customer_id,
        plaid_access_token: access_token,
        account_id,
        account_name: account_name || account.name || '',
        balance: account.balances,
        funding_source_url: fundingSourceUrl,
      });
      if (bankError) throw bankError;

      // 8. Optionally, revalidate path (if using Next.js revalidatePath)
      // @ts-expect-error - revalidatePath is not available in API routes
      if (typeof revalidatePath === 'function') revalidatePath('/dashboard');

      return NextResponse.json({ success: true, fundingSourceUrl });
    } else {
      return NextResponse.json({ error: 'Funding source creation failed' }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Plaid/Dwolla API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}