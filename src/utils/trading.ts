import { User, Transaction, PortfolioHolding, BehaviorEvent, CrisisEvent } from '../types';
import { storage } from './storage';
import { simulationEngine } from './simulation';

export const tradingEngine = {
  // Execute buy transaction
  executeBuy(userId: string, stockId: string, quantity: number): { success: boolean; message: string } {
    const user = storage.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const currentPrice = simulationEngine.getCurrentPrice(stockId);
    const totalCost = currentPrice * quantity;

    if (user.balance < totalCost) {
      return { success: false, message: 'Insufficient balance' };
    }

    const snapshot = storage.getActiveSnapshot();
    if (!snapshot) {
      return { success: false, message: 'No active simulation' };
    }

    // Create transaction
    const transaction: Transaction = {
      id: `tx-${Date.now()}-${Math.random()}`,
      userId,
      stockId,
      action: 'buy',
      quantity,
      price: currentPrice,
      timestamp: Date.now(),
      snapshotId: snapshot.id,
    };

    storage.addTransaction(transaction);

    // Update user balance
    user.balance -= totalCost;
    storage.updateUser(user);

    // Update portfolio
    const portfolio = storage.getPortfolio(userId);
    const existingHolding = portfolio.find(h => h.stockId === stockId);

    if (existingHolding) {
      const totalQuantity = existingHolding.quantity + quantity;
      const totalCost = (existingHolding.avgBuyPrice * existingHolding.quantity) + (currentPrice * quantity);
      existingHolding.quantity = totalQuantity;
      existingHolding.avgBuyPrice = totalCost / totalQuantity;
    } else {
      portfolio.push({
        stockId,
        quantity,
        avgBuyPrice: currentPrice,
      });
    }

    storage.savePortfolio(userId, portfolio);

    // Log behavior
    this.logBehavior(userId, stockId, transaction.id, 'buy');

    return { success: true, message: 'Purchase successful' };
  },

  // Execute sell transaction
  executeSell(userId: string, stockId: string, quantity: number): { success: boolean; message: string } {
    const user = storage.getUserById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const portfolio = storage.getPortfolio(userId);
    const holding = portfolio.find(h => h.stockId === stockId);

    if (!holding || holding.quantity < quantity) {
      return { success: false, message: 'Insufficient holdings' };
    }

    const snapshot = storage.getActiveSnapshot();
    if (!snapshot) {
      return { success: false, message: 'No active simulation' };
    }

    const currentPrice = simulationEngine.getCurrentPrice(stockId);
    const totalValue = currentPrice * quantity;

    // Create transaction
    const transaction: Transaction = {
      id: `tx-${Date.now()}-${Math.random()}`,
      userId,
      stockId,
      action: 'sell',
      quantity,
      price: currentPrice,
      timestamp: Date.now(),
      snapshotId: snapshot.id,
    };

    storage.addTransaction(transaction);

    // Update user balance
    user.balance += totalValue;
    storage.updateUser(user);

    // Update portfolio
    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      const index = portfolio.indexOf(holding);
      portfolio.splice(index, 1);
    }

    storage.savePortfolio(userId, portfolio);

    // Log behavior
    this.logBehavior(userId, stockId, transaction.id, 'sell');

    return { success: true, message: 'Sale successful' };
  },

  // Log behavioral event
  logBehavior(userId: string, stockId: string, transactionId: string, action: 'buy' | 'sell'): void {
    const snapshot = storage.getActiveSnapshot();
    if (!snapshot) return;

    const stock = storage.getStocks().find(s => s.id === stockId);
    if (!stock) return;

    const activeCrises = simulationEngine.getActiveCrises();
    const relevantCrisis = activeCrises.find(c => c.sector === stock.sector);

    let tradeType: BehaviorEvent['tradeType'] = 'normal';
    let reactionTime: number | null = null;
    let crisisId: string | undefined = undefined;

    if (relevantCrisis) {
      crisisId = relevantCrisis.id;
      const crisisStartTime = snapshot.createdAt + relevantCrisis.startDay * 24 * 60 * 60 * 1000;
      reactionTime = Date.now() - crisisStartTime;

      // Classify trade type
      if (action === 'sell') {
        if (reactionTime < 2 * 60 * 60 * 1000) { // Within 2 hours
          tradeType = 'panic_sell';
        } else if (reactionTime > 24 * 60 * 60 * 1000) { // After 1 day
          tradeType = 'delayed_reaction';
        } else {
          tradeType = 'normal';
        }
      } else if (action === 'buy') {
        if (relevantCrisis.impactStrength < 0) {
          tradeType = 'crisis_buy'; // Buying during negative crisis (contrarian)
        } else {
          tradeType = 'fomo_buy'; // Buying during positive crisis
        }
      }
    }

    // Calculate risk delta
    const currentPrice = simulationEngine.getCurrentPrice(stockId);
    const priceHistory = simulationEngine.getPriceHistory(stockId, snapshot.id);
    let riskDelta = 0;

    if (priceHistory.length > 1) {
      const volatility = this.calculateVolatility(priceHistory.map(p => p.price));
      riskDelta = action === 'buy' ? volatility : -volatility;
    }

    const behaviorEvent: BehaviorEvent = {
      id: `behavior-${Date.now()}-${Math.random()}`,
      userId,
      stockId,
      transactionId,
      reactionTime,
      tradeType,
      riskDelta,
      timestamp: Date.now(),
      crisisId,
    };

    storage.addBehaviorEvent(behaviorEvent);

    // Update user risk index
    const user = storage.getUserById(userId);
    if (user) {
      user.riskIndex += riskDelta;
      storage.updateUser(user);
    }
  },

  // Calculate volatility
  calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  },

  // Get portfolio value
  getPortfolioValue(userId: string): number {
    const portfolio = storage.getPortfolio(userId);
    let totalValue = 0;

    portfolio.forEach(holding => {
      const currentPrice = simulationEngine.getCurrentPrice(holding.stockId);
      totalValue += currentPrice * holding.quantity;
    });

    return totalValue;
  },

  // Get portfolio performance
  getPortfolioPerformance(userId: string): { totalValue: number; totalInvested: number; profitLoss: number; profitLossPercent: number } {
    const portfolio = storage.getPortfolio(userId);
    let totalValue = 0;
    let totalInvested = 0;

    portfolio.forEach(holding => {
      const currentPrice = simulationEngine.getCurrentPrice(holding.stockId);
      totalValue += currentPrice * holding.quantity;
      totalInvested += holding.avgBuyPrice * holding.quantity;
    });

    const profitLoss = totalValue - totalInvested;
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    return { totalValue, totalInvested, profitLoss, profitLossPercent };
  },
};
