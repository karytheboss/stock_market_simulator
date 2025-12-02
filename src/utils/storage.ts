import { User, Stock, SimulatedPrice, CrisisEvent, Transaction, PortfolioHolding, BehaviorEvent, MarketSnapshot, WeeklySummary } from '../types';

// Initialize default data
const DEFAULT_STOCKS: Stock[] = [
  { id: '1', ticker: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy', basePrice: 2450.50 },
  { id: '2', ticker: 'TCS', name: 'Tata Consultancy Services', sector: 'IT', basePrice: 3650.75 },
  { id: '3', ticker: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking', basePrice: 1580.25 },
  { id: '4', ticker: 'INFY', name: 'Infosys Ltd', sector: 'IT', basePrice: 1450.80 },
  { id: '5', ticker: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking', basePrice: 950.60 },
  { id: '6', ticker: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', sector: 'FMCG', basePrice: 2380.90 },
  { id: '7', ticker: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', basePrice: 880.45 },
  { id: '8', ticker: 'ITC', name: 'ITC Ltd', sector: 'FMCG', basePrice: 420.35 },
  { id: '9', ticker: 'SBIN', name: 'State Bank of India', sector: 'Banking', basePrice: 580.70 },
  { id: '10', ticker: 'WIPRO', name: 'Wipro Ltd', sector: 'IT', basePrice: 425.15 },
  { id: '11', ticker: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure', basePrice: 3250.40 },
  { id: '12', ticker: 'MARUTI', name: 'Maruti Suzuki India Ltd', sector: 'Automobile', basePrice: 10500.25 },
];

export const storage = {
  // Users
  getUsers(): User[] {
    const data = localStorage.getItem('users');
    if (!data) {
      const adminUser: User = {
        id: 'admin-1',
        username: 'admin',
        email: 'admin@market.com',
        password: 'admin123',
        role: 'admin',
        riskIndex: 0,
        balance: 1000000,
      };
      localStorage.setItem('users', JSON.stringify([adminUser]));
      return [adminUser];
    }
    return JSON.parse(data);
  },

  saveUsers(users: User[]): void {
    localStorage.setItem('users', JSON.stringify(users));
  },

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  },

  getUserById(id: string): User | undefined {
    return this.getUsers().find(u => u.id === id);
  },

  updateUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      this.saveUsers(users);
    }
  },

  // Stocks
  getStocks(): Stock[] {
    const data = localStorage.getItem('stocks');
    if (!data) {
      localStorage.setItem('stocks', JSON.stringify(DEFAULT_STOCKS));
      return DEFAULT_STOCKS;
    }
    return JSON.parse(data);
  },

  saveStocks(stocks: Stock[]): void {
    localStorage.setItem('stocks', JSON.stringify(stocks));
  },

  // Market Snapshots
  getSnapshots(): MarketSnapshot[] {
    const data = localStorage.getItem('snapshots');
    return data ? JSON.parse(data) : [];
  },

  saveSnapshots(snapshots: MarketSnapshot[]): void {
    localStorage.setItem('snapshots', JSON.stringify(snapshots));
  },

  getActiveSnapshot(): MarketSnapshot | null {
    return this.getSnapshots().find(s => s.isActive) || null;
  },

  // Simulated Prices
  getSimulatedPrices(): SimulatedPrice[] {
    const data = localStorage.getItem('simulatedPrices');
    return data ? JSON.parse(data) : [];
  },

  saveSimulatedPrices(prices: SimulatedPrice[]): void {
    localStorage.setItem('simulatedPrices', JSON.stringify(prices));
  },

  // Crisis Events
  getCrisisEvents(): CrisisEvent[] {
    const data = localStorage.getItem('crisisEvents');
    return data ? JSON.parse(data) : [];
  },

  saveCrisisEvents(events: CrisisEvent[]): void {
    localStorage.setItem('crisisEvents', JSON.stringify(events));
  },

  addCrisisEvent(event: CrisisEvent): void {
    const events = this.getCrisisEvents();
    events.push(event);
    this.saveCrisisEvents(events);
  },

  // Transactions
  getTransactions(): Transaction[] {
    const data = localStorage.getItem('transactions');
    return data ? JSON.parse(data) : [];
  },

  saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  },

  addTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    this.saveTransactions(transactions);
  },

  // Portfolios
  getPortfolio(userId: string): PortfolioHolding[] {
    const data = localStorage.getItem(`portfolio_${userId}`);
    return data ? JSON.parse(data) : [];
  },

  savePortfolio(userId: string, portfolio: PortfolioHolding[]): void {
    localStorage.setItem(`portfolio_${userId}`, JSON.stringify(portfolio));
  },

  // Behavior Events
  getBehaviorEvents(): BehaviorEvent[] {
    const data = localStorage.getItem('behaviorEvents');
    return data ? JSON.parse(data) : [];
  },

  saveBehaviorEvents(events: BehaviorEvent[]): void {
    localStorage.setItem('behaviorEvents', JSON.stringify(events));
  },

  addBehaviorEvent(event: BehaviorEvent): void {
    const events = this.getBehaviorEvents();
    events.push(event);
    this.saveBehaviorEvents(events);
  },

  // Weekly Summaries
  getWeeklySummaries(): WeeklySummary[] {
    const data = localStorage.getItem('weeklySummaries');
    return data ? JSON.parse(data) : [];
  },

  saveWeeklySummaries(summaries: WeeklySummary[]): void {
    localStorage.setItem('weeklySummaries', JSON.stringify(summaries));
  },

  addWeeklySummary(summary: WeeklySummary): void {
    const summaries = this.getWeeklySummaries();
    summaries.push(summary);
    this.saveWeeklySummaries(summaries);
  },

  // Current User Session
  getCurrentUser(): User | null {
    const data = localStorage.getItem('currentUser');
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  },

  // Clear all data
  clearAll(): void {
    localStorage.clear();
  },
};
