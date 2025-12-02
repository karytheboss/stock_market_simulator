import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { storage } from '../utils/storage';
import { analyticsEngine } from '../utils/analytics';
import { WeeklySummary } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileText, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export function WeeklyReportPage() {
  const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<WeeklySummary | null>(null);
  const [textualSummary, setTextualSummary] = useState('');

  useEffect(() => {
    const allSummaries = storage.getWeeklySummaries().sort((a, b) => b.createdAt - a.createdAt);
    setSummaries(allSummaries);

    if (allSummaries.length > 0) {
      setSelectedSummary(allSummaries[0]);
      setTextualSummary(analyticsEngine.generateTextualSummary(allSummaries[0]));
    }
  }, []);

  if (summaries.length === 0) {
    return (
      <Card>
        <CardContent className="py-16">
          <div className="text-center text-gray-500">
            <FileText className="size-16 mx-auto mb-4 text-gray-300" />
            <p>No weekly reports available yet</p>
            <p className="text-sm">Reports are generated at the end of each simulation week</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedSummary) return null;

  const { summary } = selectedSummary;

  // Prepare data for charts
  const sectorData = Object.entries(summary.sectorImpact).map(([sector, impact]) => ({
    sector,
    impact: parseFloat(impact.toFixed(2)),
  }));

  const tradeTypeData = [
    { type: 'Panic Sells', count: summary.panicSells, color: '#ef4444' },
    { type: 'FOMO Buys', count: summary.fomoBuys, color: '#f59e0b' },
    { type: 'Normal Trades', count: summary.totalTrades - summary.panicSells - summary.fomoBuys, color: '#10b981' },
  ];

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Report Selector */}
      {summaries.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {summaries.map(s => (
                <Badge
                  key={s.id}
                  variant={s.id === selectedSummary.id ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedSummary(s);
                    setTextualSummary(analyticsEngine.generateTextualSummary(s));
                  }}
                >
                  {formatDate(s.createdAt)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-gray-900">{summary.totalTrades}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Avg Reaction Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-gray-900">{summary.avgReactionTime.toFixed(1)}h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Panic Sells</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-red-600">{summary.panicSells}</p>
            <p className="text-xs text-gray-500">
              {((summary.panicSells / summary.totalTrades) * 100).toFixed(1)}% of trades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">FOMO Buys</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-orange-600">{summary.fomoBuys}</p>
            <p className="text-xs text-gray-500">
              {((summary.fomoBuys / summary.totalTrades) * 100).toFixed(1)}% of trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sector Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Sector Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sector" />
              <YAxis label={{ value: 'Impact (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)}%`}
              />
              <Bar dataKey="impact" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trade Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Trading Behavior Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tradeTypeData.map(item => {
              const percentage = (item.count / summary.totalTrades) * 100;
              return (
                <div key={item.type}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-700">{item.type}</span>
                    <span className="text-sm text-gray-900">
                      {item.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Crisis Timeline */}
      {summary.crisisTimeline.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="size-5" />
              Crisis Events Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.crisisTimeline.map((crisis, index) => (
                <div key={index} className="bg-white p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-gray-900">{crisis.title}</p>
                    <p className="text-sm text-gray-500">Day {crisis.day}</p>
                  </div>
                  <Badge variant={crisis.impact < 0 ? 'destructive' : 'default'}>
                    {crisis.impact > 0 ? '+' : ''}{(crisis.impact * 100).toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Traders */}
      {summary.topTraders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.topTraders.map((trader, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span className="text-gray-900">{trader.username}</span>
                  </div>
                  <span className={`${trader.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trader.profit >= 0 ? (
                      <TrendingUp className="inline size-4 mr-1" />
                    ) : (
                      <TrendingDown className="inline size-4 mr-1" />
                    )}
                    ₹{trader.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Textual Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
            {textualSummary}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
