import Dwolla from 'dwolla-v2';

export const dwollaClient = new Dwolla.Client({
  key: process.env.NEXT_DWOLLA_KEY!,
  secret: process.env.NEXT_DWOLLA_SECRET!,
  environment: process.env.NEXT_DWOLLA_ENV as 'production' | 'sandbox',
});