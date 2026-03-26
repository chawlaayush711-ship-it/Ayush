export interface User {
  id: string;
  name: string;
  phone: string;
}

export interface Group {
  id: string;
  name: string;
  contribution_amount: number;
  total_members: number;
  start_date: string;
  payout_day: number;
  status: string;
  role: string;
  payout_month_index: number;
  interest_rate: number;
}

export interface Member extends User {
  membership_id: string;
  role: string;
  payout_month_index: number;
}

export interface Payment {
  id: string;
  membership_id: string;
  month_index: number;
  amount: number;
  status: 'pending' | 'paid' | 'late';
  member_name: string;
  paid_at?: string;
  payment_method?: 'cash' | 'upi';
}
