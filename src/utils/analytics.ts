import { WeeklySummary, MarketSnapshot } from '../types';
import { storage } from './storage';
import { simulationEngine } from './simulation';
import { tradingEngine } from './trading';

export const analyticsEngine = {
  // Generate weekly summary after simulation ends
  generateWeeklySummary(snapshotId: string): WeeklySummary {
    const snapshot = storage.getSnapshots().find(s => s.id === snapshotId);
    if (!snapshot) throw new Error('Snapshot not found');

    const transactions = storage.getTransactions().filter(t => t.snapshotId === snapshotId);
    const behaviorEvents = storage.getBehaviorEvents().filter(b => {
      const tx = transactions.find(t => t.id === b.transactionId);
      return tx !== undefined;
    });
    const crisisEvents = storage.getCrisisEvents().filter(c => c.snapshotId === snapshotId);
    const stocks = storage.getStocks();
    const users = storage.getUsers().filter(u => u.role === 'user');

    // Calculate sector impact
    const sectorImpact: { [sector: string]: number } = {};
    stocks.forEach(stock => {
      const priceHistory = simulationEngine.getPriceHistory(stock.id, snapshotId);
      if (priceHistory.length > 1) {
        const startPrice = priceHistory[0].price;
        const endPrice = priceHistory[priceHistory.length - 1].price;
        const change = ((endPrice - startPrice) / startPrice) * 100;
        
        if (!sectorImpact[stock.sector]) {
          sectorImpact[stock.sector] = 0;
        }
        sectorImpact[stock.sector] += change;
      }
    });

    // Average sector impact
    Object.keys(sectorImpact).forEach(sector => {
      const stocksInSector = stocks.filter(s => s.sector === sector).length;
      sectorImpact[sector] = sectorImpact[sector] / stocksInSector;
    });

    // Calculate average reaction time
    const reactionTimes = behaviorEvents
      .filter(b => b.reactionTime !== null)
      .map(b => b.reactionTime as number);
    const avgReactionTime = reactionTimes.length > 0
      ? reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length
      : 0;

    // Count trade types
    const panicSells = behaviorEvents.filter(b => b.tradeType === 'panic_sell').length;
    const fomoBuys = behaviorEvents.filter(b => b.tradeType === 'fomo_buy').length;

    // Calculate risk index changes
    const riskIndexChanges = users.map(u => {
      const userEvents = behaviorEvents.filter(b => b.userId === u.id);
      return userEvents.reduce((sum, e) => sum + e.riskDelta, 0);
    });
    const avgRiskIndexChange = riskIndexChanges.length > 0
      ? riskIndexChanges.reduce((sum, r) => sum + r, 0) / riskIndexChanges.length
      : 0;

    // Top traders by profit
    const topTraders = users.map(user => {
      const performance = tradingEngine.getPortfolioPerformance(user.id);
      return {
        username: user.username,
        profit: performance.profitLoss,
      };
    })
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

    // Crisis timeline
    const crisisTimeline = crisisEvents.map(c => ({
      title: c.title,
      day: c.startDay,
      impact: c.impactStrength,
    }));

    const summary: WeeklySummary = {
      id: `summary-${Date.now()}`,
      snapshotId,
      summary: {
        sectorImpact,
        avgReactionTime: avgReactionTime / (1000 * 60 * 60), // Convert to hours
        totalTrades: transactions.length,
        panicSells,
        fomoBuys,
        riskIndexChange: avgRiskIndexChange,
        topTraders,
        crisisTimeline,
      },
      createdAt: Date.now(),
    };

    storage.addWeeklySummary(summary);
    return summary;
  },

  // Get user behavior stats
  getUserBehaviorStats(userId: string, snapshotId?: string) {
    let transactions = storage.getTransactions().filter(t => t.userId === userId);
    if (snapshotId) {
      transactions = transactions.filter(t => t.snapshotId === snapshotId);
    }

    const behaviorEvents = storage.getBehaviorEvents().filter(b => {
      const tx = transactions.find(t => t.id === b.transactionId);
      return tx !== undefined;
    });

    const tradeTypeCounts = {
      panic_sell: behaviorEvents.filter(b => b.tradeType === 'panic_sell').length,
      fomo_buy: behaviorEvents.filter(b => b.tradeType === 'fomo_buy').length,
      delayed_reaction: behaviorEvents.filter(b => b.tradeType === 'delayed_reaction').length,
      crisis_buy: behaviorEvents.filter(b => b.tradeType === 'crisis_buy').length,
      normal: behaviorEvents.filter(b => b.tradeType === 'normal').length,
    };

    const avgReactionTime = behaviorEvents
      .filter(b => b.reactionTime !== null)
      .reduce((sum, b) => sum + (b.reactionTime as number), 0) / behaviorEvents.length || 0;

    return {
      totalTrades: transactions.length,
      tradeTypeCounts,
      avgReactionTime: avgReactionTime / (1000 * 60 * 60), // hours
      totalRiskDelta: behaviorEvents.reduce((sum, b) => sum + b.riskDelta, 0),
    };
  },

  // Get textual summary
  generateTextualSummary(summary: WeeklySummary): string {
    const { sectorImpact, avgReactionTime, totalTrades, panicSells, fomoBuys, riskIndexChange, topTraders, crisisTimeline } = summary.summary;

    let text = `Weekly Simulation Summary\n\n`;
    
    text += `Market Overview:\n`;
    text += `- Total trades executed: ${totalTrades}\n`;
    text += `- Panic sells: ${panicSells} (${((panicSells/totalTrades)*100).toFixed(1)}%)\n`;
    text += `- FOMO buys: ${fomoBuys} (${((fomoBuys/totalTrades)*100).toFixed(1)}%)\n`;
    text += `- Average reaction time: ${avgReactionTime.toFixed(2)} hours\n\n`;

    text += `Sector Performance:\n`;
    Object.entries(sectorImpact).forEach(([sector, impact]) => {
      text += `- ${sector}: ${impact > 0 ? '+' : ''}${impact.toFixed(2)}%\n`;
    });
    text += `\n`;

    if (crisisTimeline.length > 0) {
      text += `Crisis Events:\n`;
      crisisTimeline.forEach(c => {
        text += `- Day ${c.day}: ${c.title} (Impact: ${c.impact > 0 ? '+' : ''}${(c.impact * 100).toFixed(1)}%)\n`;
      });
      text += `\n`;
    }

    text += `Behavioral Insights:\n`;
    text += `- Average risk index change: ${riskIndexChange > 0 ? '+' : ''}${riskIndexChange.toFixed(3)}\n`;
    text += `- Traders showed ${avgReactionTime < 2 ? 'quick' : avgReactionTime < 12 ? 'moderate' : 'slow'} reactions to crisis events.\n`;
    text += `- ${panicSells > fomoBuys ? 'Risk-averse' : 'Risk-seeking'} behavior was dominant this week.\n\n`;

    if (topTraders.length > 0) {
      text += `Top Performers:\n`;
      topTraders.forEach((t, i) => {
        text += `${i + 1}. ${t.username}: ₹${t.profit.toFixed(2)}\n`;
      });
    }

    return text;
  },
};
