export interface Customer {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  date_of_birth: string;
  nin: string;
  email: string;
}

export interface Bank {
  id: string;
  customer_id: string;
  plaid_access_token: string;
  account_id: string;
  account_name: string;
  balance: {
    available: number;
    current: number;
    iso_currency_code: string;
  };
  funding_source_url: string;
}

export interface Transaction {
  id: string;
  customer_id: string;
  bank_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  status: string;
  dwolla_transaction_id: string | null;
  created_at: string;
}