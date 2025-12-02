export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  riskIndex: number;
  balance: number;
}

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  basePrice: number;
}

export interface SimulatedPrice {
  id: string;
  stockId: string;
  dayIndex: number;
  price: number;
  timestamp: number;
  snapshotId: string;
}

export interface CrisisEvent {
  id: string;
  snapshotId: string;
  title: string;
  description: string;
  sector: string;
  impactStrength: number;
  startDay: number;
  endDay: number;
  createdAt: number;
}

export interface Transaction {
  id: string;
  userId: string;
  stockId: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
  snapshotId: string;
}

export interface PortfolioHolding {
  stockId: string;
  quantity: number;
  avgBuyPrice: number;
}

export interface BehaviorEvent {
  id: string;
  userId: string;
  stockId: string;
  transactionId: string;
  reactionTime: number | null;
  tradeType: 'panic_sell' | 'fomo_buy' | 'delayed_reaction' | 'normal' | 'crisis_buy';
  riskDelta: number;
  timestamp: number;
  crisisId?: string;
}

export interface MarketSnapshot {
  id: string;
  date: string;
  currentDay: number;
  isActive: boolean;
  createdAt: number;
}

export interface WeeklySummary {
  id: string;
  snapshotId: string;
  summary: {
    sectorImpact: { [sector: string]: number };
    avgReactionTime: number;
    totalTrades: number;
    panicSells: number;
    fomoBuys: number;
    riskIndexChange: number;
    topTraders: Array<{ username: string; profit: number }>;
    crisisTimeline: Array<{ title: string; day: number; impact: number }>;
  };
  createdAt: number;
}
