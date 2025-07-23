import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.NEXT_PLAID_ENV!],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.NEXT_PLAID_CLIENT_ID!,
      'PLAID-SECRET': process.env.NEXT_PLAID_SECRET!,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);