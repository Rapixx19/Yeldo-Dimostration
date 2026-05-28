export type Instrument = 'senior_loan' | 'mezzanine' | 'senior_debt' | 'secured_mezzanine';
export type Distribution = 'quarterly' | 'at_maturity';
export type DealStatus = 'open' | 'closed' | 'exited';
export type SentimentLabel = 'bullish' | 'neutral' | 'cautious';

export interface SentimentSignal {
  text: string;
  polarity: 'positive' | 'negative';
}

export interface Risk {
  category: string;
  severity: 'low' | 'med' | 'high';
  note: string;
}

export type DealEventType = 'launch' | 'milestone' | 'news' | 'status_change';

export interface DealEvent {
  id: string;
  dealId: string;
  eventType: DealEventType | string;
  message: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  slug: string;
  name: string;
  location: string;
  country: string;
  assetClass: string;
  instrument: Instrument;
  targetRaise: number;
  raisedAmount: number;
  targetIRR: number;
  maturityMonths: number;
  loanToValue: number;
  distribution: Distribution;
  minimumTicket: number;
  status: DealStatus;
  startDate: string;
  maturityDate: string;
  closesAt: string | null;
  sentimentLabel: SentimentLabel;
  sentimentScore: number;
  sentimentSignals: SentimentSignal[];
  sponsorName: string;
  sponsorDescription: string;
  hasFirstLienMortgage: boolean;
  risks: Risk[];
  description: string;
  imageUrl: string | null;
  createdAt: string;
  events?: DealEvent[];
}

export interface Investment {
  id: string;
  userId: string;
  dealId: string;
  amount: number;
  investedAt: string;
  deal: Deal;
}

export interface PortfolioKPIs {
  totalInvested: number;
  weightedIRR: number;
  projectedReturns: number;
  activeDealsCount: number;
  countryAllocation: Record<string, { amount: number; pct: number }>;
}

export interface DealFilters {
  country?: string;
  instrument?: Instrument;
  status?: DealStatus;
  maturityMin?: number;
  maturityMax?: number;
}
