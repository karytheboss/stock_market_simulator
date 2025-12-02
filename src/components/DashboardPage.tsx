import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { storage } from '../utils/storage';
import { simulationEngine } from '../utils/simulation';
import { Stock, CrisisEvent } from '../types';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

export function DashboardPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [activeCrises, setActiveCrises] = useState<CrisisEvent[]>([]);
  const [snapshot, setSnapshot] = useState(storage.getActiveSnapshot());

  useEffect(() => {
    setStocks(storage.getStocks());
    setActiveCrises(simulationEngine.getActiveCrises());
    setSnapshot(storage.getActiveSnapshot());
  }, []);

  const getStockPrice = (stockId: string) => {
    return simulationEngine.getCurrentPrice(stockId);
  };

  const getPriceChange = (stockId: string) => {
    if (!snapshot) return 0;
    const history = simulationEngine.getPriceHistory(stockId, snapshot.id);
    if (history.length < 2) return 0;
    
    const currentPrice = history[history.length - 1].price;
    const previousPrice = history[history.length - 2]?.price || history[0].price;
    
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  };

  const getCrisisForSector = (sector: string) => {
    return activeCrises.find(c => c.sector === sector);
  };

  return (
    <div className="space-y-6">
      {/* Market Status */}
      <Card>
        <CardHeader>
          <CardTitle>Market Status</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot ? (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Simulation Day</p>
                <p className="text-2xl text-gray-900">Day {snapshot.currentDay} / 5</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Crises</p>
                <p className="text-2xl text-gray-900">{activeCrises.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Stocks</p>
                <p className="text-2xl text-gray-900">{stocks.length}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No active simulation</p>
              <p className="text-sm">Contact admin to start a new simulation week</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Crisis Alerts */}
      {activeCrises.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="size-5" />
              Active Crisis Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeCrises.map(crisis => (
                <div key={crisis.id} className="bg-white p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-gray-900">{crisis.title}</h4>
                    <Badge variant={crisis.impactStrength < 0 ? 'destructive' : 'default'}>
                      {crisis.sector}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{crisis.description}</p>
                  <p className="text-sm text-gray-500">
                    Impact: {crisis.impactStrength > 0 ? '+' : ''}{(crisis.impactStrength * 100).toFixed(1)}% | 
                    Duration: Day {crisis.startDay} - {crisis.endDay}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock List */}
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Ticker</th>
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="text-left py-3 px-4">Sector</th>
                  <th className="text-right py-3 px-4">Price</th>
                  <th className="text-right py-3 px-4">Change</th>
                  <th className="text-center py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(stock => {
                  const price = getStockPrice(stock.id);
                  const change = getPriceChange(stock.id);
                  const crisis = getCrisisForSector(stock.sector);

                  return (
                    <tr key={stock.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{stock.ticker}</td>
                      <td className="py-3 px-4">{stock.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{stock.sector}</Badge>
                      </td>
                      <td className="text-right py-3 px-4">
                        ₹{price.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {change >= 0 ? (
                            <TrendingUp className="inline size-4 mr-1" />
                          ) : (
                            <TrendingDown className="inline size-4 mr-1" />
                          )}
                          {change.toFixed(2)}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        {crisis && (
                          <Badge 
                            variant={crisis.impactStrength < 0 ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            Crisis
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
