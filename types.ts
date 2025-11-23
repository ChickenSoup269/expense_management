export type TransactionType = 'expense' | 'income';

export type Category = 
  | 'food' 
  | 'transport' 
  | 'utilities' 
  | 'shopping' 
  | 'entertainment' 
  | 'health' 
  | 'education' 
  | 'income' 
  | 'other';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // ISO string YYYY-MM-DD
  note: string;
}

export interface Budget {
  monthlyLimit: number;
  savingsGoal: number;
}

export type ViewMode = 'dashboard' | 'transactions' | 'analytics';

export type DateFilter = 'week' | 'month' | 'year' | 'all' | 'custom';

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface DailySpending {
  date: string;
  amount: number;
}