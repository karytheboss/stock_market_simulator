import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { storage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { Transaction, BehaviorEvent } from '../types';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export function HistoryPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [behaviorEvents, setBehaviorEvents] = useState<BehaviorEvent[]>([]);

  useEffect(() => {
    if (!user) return;

    const userTransactions = storage.getTransactions()
      .filter(t => t.userId === user.id)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    setTransactions(userTransactions);

    const userBehaviors = storage.getBehaviorEvents()
      .filter(b => b.userId === user.id)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    setBehaviorEvents(userBehaviors);
  }, [user]);

  const getStock = (stockId: string) => {
    return storage.getStocks().find(s => s.id === stockId);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatReactionTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTradeTypeColor = (type: BehaviorEvent['tradeType']) => {
    switch (type) {
      case 'panic_sell': return 'destructive';
      case 'fomo_buy': return 'destructive';
      case 'delayed_reaction': return 'secondary';
      case 'crisis_buy': return 'default';
      default: return 'outline';
    }
  };

  const getTradeTypeLabel = (type: BehaviorEvent['tradeType']) => {
    switch (type) {
      case 'panic_sell': return 'Panic Sell';
      case 'fomo_buy': return 'FOMO Buy';
      case 'delayed_reaction': return 'Delayed';
      case 'crisis_buy': return 'Crisis Buy';
      default: return 'Normal';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Trading History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="behavior">Behavioral Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No transactions yet</p>
                  <p className="text-sm">Your trading history will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date/Time</th>
                        <th className="text-left py-3 px-4">Stock</th>
                        <th className="text-center py-3 px-4">Action</th>
                        <th className="text-right py-3 px-4">Quantity</th>
                        <th className="text-right py-3 px-4">Price</th>
                        <th className="text-right py-3 px-4">Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => {
                        const stock = getStock(tx.stockId);
                        if (!stock) return null;

                        return (
                          <tr key={tx.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(tx.timestamp)}
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p>{stock.ticker}</p>
                                <p className="text-xs text-gray-500">{stock.name}</p>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              {tx.action === 'buy' ? (
                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                  <ArrowDownCircle className="size-3 mr-1" />
                                  Buy
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 border-red-300">
                                  <ArrowUpCircle className="size-3 mr-1" />
                                  Sell
                                </Badge>
                              )}
                            </td>
                            <td className="text-right py-3 px-4">{tx.quantity}</td>
                            <td className="text-right py-3 px-4">₹{tx.price.toFixed(2)}</td>
                            <td className="text-right py-3 px-4">
                              ₹{(tx.quantity * tx.price).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="behavior">
              {behaviorEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No behavioral data yet</p>
                  <p className="text-sm">Your trading behavior will be analyzed here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date/Time</th>
                        <th className="text-left py-3 px-4">Stock</th>
                        <th className="text-center py-3 px-4">Trade Type</th>
                        <th className="text-right py-3 px-4">Reaction Time</th>
                        <th className="text-right py-3 px-4">Risk Delta</th>
                        <th className="text-center py-3 px-4">Crisis Event</th>
                      </tr>
                    </thead>
                    <tbody>
                      {behaviorEvents.map(event => {
                        const stock = getStock(event.stockId);
                        if (!stock) return null;

                        const crisis = event.crisisId 
                          ? storage.getCrisisEvents().find(c => c.id === event.crisisId)
                          : null;

                        return (
                          <tr key={event.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(event.timestamp)}
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p>{stock.ticker}</p>
                                <p className="text-xs text-gray-500">{stock.name}</p>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4">
                              <Badge variant={getTradeTypeColor(event.tradeType)}>
                                {getTradeTypeLabel(event.tradeType)}
                              </Badge>
                            </td>
                            <td className="text-right py-3 px-4">
                              {event.reactionTime !== null 
                                ? formatReactionTime(event.reactionTime)
                                : '-'}
                            </td>
                            <td className="text-right py-3 px-4">
                              <span className={event.riskDelta >= 0 ? 'text-red-600' : 'text-green-600'}>
                                {event.riskDelta >= 0 ? '+' : ''}{event.riskDelta.toFixed(3)}
                              </span>
                            </td>
                            <td className="text-center py-3 px-4">
                              {crisis ? (
                                <div className="text-xs">
                                  <p className="text-gray-900">{crisis.title}</p>
                                  <p className="text-gray-500">{crisis.sector}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-gray-900">{transactions.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Buy Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-gray-900">
              {transactions.filter(t => t.action === 'buy').length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Sell Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-gray-900">
              {transactions.filter(t => t.action === 'sell').length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
