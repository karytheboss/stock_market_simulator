import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Badge } from './ui/badge';
import { storage } from '../utils/storage';
import { simulationEngine } from '../utils/simulation';
import { tradingEngine } from '../utils/trading';
import { useAuth } from '../contexts/AuthContext';
import { Stock } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function TradePage() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('1');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setStocks(storage.getStocks());
  }, []);

  const getStockPrice = (stockId: string) => {
    return simulationEngine.getCurrentPrice(stockId);
  };

  const getPriceChange = (stockId: string) => {
    const snapshot = storage.getActiveSnapshot();
    if (!snapshot) return 0;
    
    const history = simulationEngine.getPriceHistory(stockId, snapshot.id);
    if (history.length < 2) return 0;
    
    const currentPrice = history[history.length - 1].price;
    const previousPrice = history[history.length - 2]?.price || history[0].price;
    
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  };

  const getUserHolding = (stockId: string) => {
    if (!user) return 0;
    const portfolio = storage.getPortfolio(user.id);
    const holding = portfolio.find(h => h.stockId === stockId);
    return holding?.quantity || 0;
  };

  const openTradeDialog = (stock: Stock, type: 'buy' | 'sell') => {
    setSelectedStock(stock);
    setTradeType(type);
    setQuantity('1');
    setIsDialogOpen(true);
  };

  const executeTrade = () => {
    if (!selectedStock || !user) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const result = tradeType === 'buy' 
      ? tradingEngine.executeBuy(user.id, selectedStock.id, qty)
      : tradingEngine.executeSell(user.id, selectedStock.id, qty);

    if (result.success) {
      toast.success(result.message);
      setIsDialogOpen(false);
      
      // Refresh user data
      const updatedUser = storage.getUserById(user.id);
      if (updatedUser) {
        storage.setCurrentUser(updatedUser);
        window.location.reload();
      }
    } else {
      toast.error(result.message);
    }
  };

  const getTotalCost = () => {
    if (!selectedStock) return 0;
    const qty = parseInt(quantity) || 0;
    return getStockPrice(selectedStock.id) * qty;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stock Trading</CardTitle>
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
                  <th className="text-right py-3 px-4">Holdings</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(stock => {
                  const price = getStockPrice(stock.id);
                  const change = getPriceChange(stock.id);
                  const holdings = getUserHolding(stock.id);

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
                      <td className="text-right py-3 px-4">
                        {holdings}
                      </td>
                      <td className="text-right py-3 px-4">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => openTradeDialog(stock, 'buy')}
                          >
                            Buy
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openTradeDialog(stock, 'sell')}
                            disabled={holdings === 0}
                          >
                            Sell
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Trade Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedStock?.ticker}
            </DialogTitle>
            <DialogDescription>
              {selectedStock?.name} - {selectedStock?.sector}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-gray-500">Current Price</p>
              <p className="text-2xl text-gray-900">
                ₹{selectedStock ? getStockPrice(selectedStock.id).toFixed(2) : '0.00'}
              </p>
            </div>

            {tradeType === 'sell' && selectedStock && (
              <div>
                <p className="text-sm text-gray-500">Available Holdings</p>
                <p className="text-gray-900">
                  {getUserHolding(selectedStock.id)} shares
                </p>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-700 block mb-2">Quantity</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Total {tradeType === 'buy' ? 'Cost' : 'Value'}</p>
              <p className="text-2xl text-gray-900">
                ₹{getTotalCost().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {tradeType === 'buy' && user && getTotalCost() > user.balance && (
              <p className="text-sm text-red-600">Insufficient balance</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={executeTrade}
              disabled={tradeType === 'buy' && user ? getTotalCost() > user.balance : false}
            >
              Confirm {tradeType === 'buy' ? 'Purchase' : 'Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
