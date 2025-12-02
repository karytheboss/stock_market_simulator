import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { storage } from '../utils/storage';
import { simulationEngine } from '../utils/simulation';
import { tradingEngine } from '../utils/trading';
import { useAuth } from '../contexts/AuthContext';
import { PortfolioHolding } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function PortfolioPage() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [performance, setPerformance] = useState({ totalValue: 0, totalInvested: 0, profitLoss: 0, profitLossPercent: 0 });
  const [valueHistory, setValueHistory] = useState<Array<{ day: number; value: number }>>([]);

  useEffect(() => {
    if (!user) return;

    const holdings = storage.getPortfolio(user.id);
    setPortfolio(holdings);

    const perf = tradingEngine.getPortfolioPerformance(user.id);
    setPerformance(perf);

    // Generate value history
    const snapshot = storage.getActiveSnapshot();
    if (snapshot) {
      const history = [];
      for (let day = 0; day <= snapshot.currentDay; day++) {
        let totalValue = 0;
        holdings.forEach(holding => {
          const prices = simulationEngine.getPriceHistory(holding.stockId, snapshot.id);
          const dayPrice = prices.find(p => p.dayIndex === day);
          if (dayPrice) {
            totalValue += dayPrice.price * holding.quantity;
          }
        });
        history.push({ day, value: totalValue });
      }
      setValueHistory(history);
    }
  }, [user]);

  const getStock = (stockId: string) => {
    return storage.getStocks().find(s => s.id === stockId);
  };

  const getCurrentPrice = (stockId: string) => {
    return simulationEngine.getCurrentPrice(stockId);
  };

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-gray-900">
              ₹{performance.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-gray-900">
              ₹{performance.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl ${performance.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {performance.profitLoss >= 0 ? '+' : ''}₹{performance.profitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Return %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl ${performance.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {performance.profitLossPercent >= 0 ? (
                <TrendingUp className="inline size-5 mr-1" />
              ) : (
                <TrendingDown className="inline size-5 mr-1" />
              )}
              {performance.profitLossPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Value Chart */}
      {valueHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Value Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={valueHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  label={{ value: 'Simulation Day', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Value (₹)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          {portfolio.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No holdings yet</p>
              <p className="text-sm">Start trading to build your portfolio</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Stock</th>
                    <th className="text-left py-3 px-4">Sector</th>
                    <th className="text-right py-3 px-4">Quantity</th>
                    <th className="text-right py-3 px-4">Avg Buy Price</th>
                    <th className="text-right py-3 px-4">Current Price</th>
                    <th className="text-right py-3 px-4">Current Value</th>
                    <th className="text-right py-3 px-4">P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map(holding => {
                    const stock = getStock(holding.stockId);
                    if (!stock) return null;

                    const currentPrice = getCurrentPrice(holding.stockId);
                    const currentValue = currentPrice * holding.quantity;
                    const invested = holding.avgBuyPrice * holding.quantity;
                    const pl = currentValue - invested;
                    const plPercent = (pl / invested) * 100;

                    return (
                      <tr key={holding.stockId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p>{stock.ticker}</p>
                            <p className="text-xs text-gray-500">{stock.name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{stock.sector}</Badge>
                        </td>
                        <td className="text-right py-3 px-4">{holding.quantity}</td>
                        <td className="text-right py-3 px-4">₹{holding.avgBuyPrice.toFixed(2)}</td>
                        <td className="text-right py-3 px-4">₹{currentPrice.toFixed(2)}</td>
                        <td className="text-right py-3 px-4">₹{currentValue.toFixed(2)}</td>
                        <td className="text-right py-3 px-4">
                          <div className={pl >= 0 ? 'text-green-600' : 'text-red-600'}>
                            <div>{pl >= 0 ? '+' : ''}₹{pl.toFixed(2)}</div>
                            <div className="text-xs">
                              ({pl >= 0 ? '+' : ''}{plPercent.toFixed(2)}%)
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Index */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Risk Index</p>
              <p className="text-2xl text-gray-900">{user?.riskIndex.toFixed(3)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Risk Classification</p>
              <Badge variant={
                (user?.riskIndex || 0) < 0.1 ? 'default' : 
                (user?.riskIndex || 0) < 0.3 ? 'secondary' : 
                'destructive'
              }>
                {(user?.riskIndex || 0) < 0.1 ? 'Conservative' : 
                 (user?.riskIndex || 0) < 0.3 ? 'Moderate' : 
                 'Aggressive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
