import { Stock, SimulatedPrice, CrisisEvent, MarketSnapshot } from '../types';
import { storage } from './storage';

export const simulationEngine = {
  // Generate simulated prices for 5 days
  generateSimulation(snapshot: MarketSnapshot): void {
    const stocks = storage.getStocks();
    const crisisEvents = storage.getCrisisEvents().filter(e => e.snapshotId === snapshot.id);
    const prices: SimulatedPrice[] = [];

    for (let day = 0; day <= 5; day++) {
      stocks.forEach(stock => {
        const basePrice = stock.basePrice;
        const randomNoise = (Math.random() - 0.5) * 0.04; // -2% to +2%
        
        // Calculate crisis factor
        let crisisFactor = 0;
        crisisEvents.forEach(crisis => {
          if (day >= crisis.startDay && day <= crisis.endDay && crisis.sector === stock.sector) {
            crisisFactor += crisis.impactStrength;
          }
        });

        // Calculate previous day price for continuity
        let prevPrice = basePrice;
        if (day > 0) {
          const prevPrices = prices.filter(p => p.stockId === stock.id && p.dayIndex === day - 1);
          if (prevPrices.length > 0) {
            prevPrice = prevPrices[0].price;
          }
        }

        const newPrice = prevPrice * (1 + randomNoise + crisisFactor);

        prices.push({
          id: `${snapshot.id}-${stock.id}-${day}`,
          stockId: stock.id,
          dayIndex: day,
          price: Math.round(newPrice * 100) / 100,
          timestamp: Date.now() + day * 24 * 60 * 60 * 1000,
          snapshotId: snapshot.id,
        });
      });
    }

    storage.saveSimulatedPrices(prices);
  },

  // Get current price for a stock
  getCurrentPrice(stockId: string): number {
    const snapshot = storage.getActiveSnapshot();
    if (!snapshot) {
      const stock = storage.getStocks().find(s => s.id === stockId);
      return stock?.basePrice || 0;
    }

    const prices = storage.getSimulatedPrices().filter(
      p => p.snapshotId === snapshot.id && p.stockId === stockId && p.dayIndex === snapshot.currentDay
    );

    if (prices.length > 0) {
      return prices[0].price;
    }

    const stock = storage.getStocks().find(s => s.id === stockId);
    return stock?.basePrice || 0;
  },

  // Get price history for a stock
  getPriceHistory(stockId: string, snapshotId: string): SimulatedPrice[] {
    return storage.getSimulatedPrices()
      .filter(p => p.snapshotId === snapshotId && p.stockId === stockId)
      .sort((a, b) => a.dayIndex - b.dayIndex);
  },

  // Get active crises for current day
  getActiveCrises(): CrisisEvent[] {
    const snapshot = storage.getActiveSnapshot();
    if (!snapshot) return [];

    return storage.getCrisisEvents().filter(
      c => c.snapshotId === snapshot.id && 
           c.startDay <= snapshot.currentDay && 
           c.endDay >= snapshot.currentDay
    );
  },

  // Advance simulation to next day
  advanceDay(): boolean {
    const snapshots = storage.getSnapshots();
    const activeSnapshot = snapshots.find(s => s.isActive);
    
    if (!activeSnapshot) return false;
    if (activeSnapshot.currentDay >= 5) return false;

    activeSnapshot.currentDay++;
    storage.saveSnapshots(snapshots);
    return true;
  },

  // Import Monday prices (simulate fetching NSE data)
  importMondayPrices(): void {
    const stocks = storage.getStocks();
    
    // Simulate fetching real prices - add small random variation to base prices
    stocks.forEach(stock => {
      const variation = (Math.random() - 0.5) * 0.1; // -5% to +5%
      stock.basePrice = Math.round(stock.basePrice * (1 + variation) * 100) / 100;
    });
    
    storage.saveStocks(stocks);
  },

  // Create new simulation week
  createNewSnapshot(): MarketSnapshot {
    // Deactivate existing snapshots
    const snapshots = storage.getSnapshots();
    snapshots.forEach(s => s.isActive = false);
    
    const newSnapshot: MarketSnapshot = {
      id: `snapshot-${Date.now()}`,
      date: new Date().toISOString(),
      currentDay: 0,
      isActive: true,
      createdAt: Date.now(),
    };
    
    snapshots.push(newSnapshot);
    storage.saveSnapshots(snapshots);
    
    // Generate simulated prices
    this.generateSimulation(newSnapshot);
    
    return newSnapshot;
  },
};
