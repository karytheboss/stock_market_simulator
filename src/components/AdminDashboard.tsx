import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { storage } from '../utils/storage';
import { simulationEngine } from '../utils/simulation';
import { analyticsEngine } from '../utils/analytics';
import { CrisisEvent } from '../types';
import { toast } from 'sonner@2.0.3';
import { Download, PlayCircle, Plus, Calendar, Users, TrendingUp, Trash2 } from 'lucide-react';

export function AdminDashboard() {
  const [snapshot, setSnapshot] = useState(storage.getActiveSnapshot());
  const [crises, setCrises] = useState<CrisisEvent[]>([]);
  const [isCreateCrisisOpen, setIsCreateCrisisOpen] = useState(false);
  const [userCount, setUserCount] = useState(0);

  // Crisis form state
  const [crisisTitle, setCrisisTitle] = useState('');
  const [crisisDescription, setCrisisDescription] = useState('');
  const [crisisSector, setCrisisSector] = useState('');
  const [crisisImpact, setCrisisImpact] = useState('-0.10');
  const [crisisStartDay, setCrisisStartDay] = useState('1');
  const [crisisEndDay, setCrisisEndDay] = useState('3');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const activeSnapshot = storage.getActiveSnapshot();
    setSnapshot(activeSnapshot);

    if (activeSnapshot) {
      const snapshotCrises = storage.getCrisisEvents().filter(c => c.snapshotId === activeSnapshot.id);
      setCrises(snapshotCrises);
    }

    const users = storage.getUsers().filter(u => u.role === 'user');
    setUserCount(users.length);
  };

  const handleImportPrices = () => {
    simulationEngine.importMondayPrices();
    toast.success('Monday prices imported successfully');
    loadData();
  };

  const handleStartSimulation = () => {
    const newSnapshot = simulationEngine.createNewSnapshot();
    setSnapshot(newSnapshot);
    toast.success('New simulation week started');
    loadData();
  };

  const handleAdvanceDay = () => {
    const success = simulationEngine.advanceDay();
    if (success) {
      toast.success('Advanced to next day');
      loadData();
    } else {
      toast.error('Cannot advance day (already at day 5 or no active simulation)');
    }
  };

  const handleGenerateReport = () => {
    if (!snapshot) {
      toast.error('No active simulation');
      return;
    }

    if (snapshot.currentDay < 5) {
      toast.error('Wait until day 5 to generate report');
      return;
    }

    const summary = analyticsEngine.generateWeeklySummary(snapshot.id);
    toast.success('Weekly report generated');
  };

  const handleCreateCrisis = () => {
    if (!snapshot) {
      toast.error('Start a simulation first');
      return;
    }

    if (!crisisTitle || !crisisDescription || !crisisSector) {
      toast.error('Please fill all fields');
      return;
    }

    const newCrisis: CrisisEvent = {
      id: `crisis-${Date.now()}`,
      snapshotId: snapshot.id,
      title: crisisTitle,
      description: crisisDescription,
      sector: crisisSector,
      impactStrength: parseFloat(crisisImpact),
      startDay: parseInt(crisisStartDay),
      endDay: parseInt(crisisEndDay),
      createdAt: Date.now(),
    };

    storage.addCrisisEvent(newCrisis);
    
    // Regenerate simulation with new crisis
    simulationEngine.generateSimulation(snapshot);
    
    toast.success('Crisis event created');
    setIsCreateCrisisOpen(false);
    resetCrisisForm();
    loadData();
  };

  const handleDeleteCrisis = (crisisId: string) => {
    const allCrises = storage.getCrisisEvents();
    const filtered = allCrises.filter(c => c.id !== crisisId);
    storage.saveCrisisEvents(filtered);
    
    // Regenerate simulation without this crisis
    if (snapshot) {
      simulationEngine.generateSimulation(snapshot);
    }
    
    toast.success('Crisis deleted');
    loadData();
  };

  const resetCrisisForm = () => {
    setCrisisTitle('');
    setCrisisDescription('');
    setCrisisSector('');
    setCrisisImpact('-0.10');
    setCrisisStartDay('1');
    setCrisisEndDay('3');
  };

  const sectors = ['IT', 'Banking', 'Energy', 'FMCG', 'Telecom', 'Infrastructure', 'Automobile'];

  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button onClick={handleImportPrices} variant="outline" className="w-full">
              <Download className="size-4 mr-2" />
              Import Monday NSE Prices
            </Button>

            <Button onClick={handleStartSimulation} className="w-full">
              <PlayCircle className="size-4 mr-2" />
              Start New Simulation Week
            </Button>

            <Button 
              onClick={handleAdvanceDay} 
              variant="outline"
              disabled={!snapshot || snapshot.currentDay >= 5}
              className="w-full"
            >
              <Calendar className="size-4 mr-2" />
              Advance to Next Day
            </Button>

            <Button 
              onClick={handleGenerateReport}
              variant="outline"
              disabled={!snapshot || snapshot.currentDay < 5}
              className="w-full"
            >
              <TrendingUp className="size-4 mr-2" />
              Generate Weekly Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Simulation Status */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Simulation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={snapshot ? 'default' : 'secondary'}>
              {snapshot ? 'Active' : 'Inactive'}
            </Badge>
            {snapshot && (
              <p className="text-sm text-gray-600 mt-2">
                Day {snapshot.currentDay} / 5
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Active Crises</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-gray-900">
              {snapshot ? simulationEngine.getActiveCrises().length : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Crises</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-gray-900">{crises.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Registered Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl text-gray-900">
              <Users className="inline size-5 mr-2" />
              {userCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Crisis Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Crisis Events</CardTitle>
          <Button 
            onClick={() => setIsCreateCrisisOpen(true)}
            disabled={!snapshot}
          >
            <Plus className="size-4 mr-2" />
            Create Crisis
          </Button>
        </CardHeader>
        <CardContent>
          {crises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No crisis events created</p>
              <p className="text-sm">Create crisis events to influence market behavior</p>
            </div>
          ) : (
            <div className="space-y-3">
              {crises.map(crisis => (
                <div key={crisis.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="text-gray-900">{crisis.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{crisis.description}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteCrisis(crisis.id)}
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap mt-3">
                    <Badge variant="outline">{crisis.sector}</Badge>
                    <Badge variant={crisis.impactStrength < 0 ? 'destructive' : 'default'}>
                      Impact: {crisis.impactStrength > 0 ? '+' : ''}{(crisis.impactStrength * 100).toFixed(1)}%
                    </Badge>
                    <Badge variant="secondary">
                      Day {crisis.startDay} - {crisis.endDay}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Crisis Dialog */}
      <Dialog open={isCreateCrisisOpen} onOpenChange={setIsCreateCrisisOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Crisis Event</DialogTitle>
            <DialogDescription>
              Define a crisis event that will impact specific market sectors
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="crisis-title">Crisis Title</Label>
              <Input
                id="crisis-title"
                value={crisisTitle}
                onChange={(e) => setCrisisTitle(e.target.value)}
                placeholder="e.g., Banking Sector Regulatory Changes"
              />
            </div>

            <div>
              <Label htmlFor="crisis-description">Description</Label>
              <Textarea
                id="crisis-description"
                value={crisisDescription}
                onChange={(e) => setCrisisDescription(e.target.value)}
                placeholder="Describe the crisis event and its context"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="crisis-sector">Target Sector</Label>
                <Select value={crisisSector} onValueChange={setCrisisSector}>
                  <SelectTrigger id="crisis-sector">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map(sector => (
                      <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="crisis-impact">Impact Strength</Label>
                <Input
                  id="crisis-impact"
                  type="number"
                  step="0.01"
                  value={crisisImpact}
                  onChange={(e) => setCrisisImpact(e.target.value)}
                  placeholder="-0.10 for -10%"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Negative = price drop, Positive = price surge
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="crisis-start">Start Day (0-5)</Label>
                <Input
                  id="crisis-start"
                  type="number"
                  min="0"
                  max="5"
                  value={crisisStartDay}
                  onChange={(e) => setCrisisStartDay(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="crisis-end">End Day (0-5)</Label>
                <Input
                  id="crisis-end"
                  type="number"
                  min="0"
                  max="5"
                  value={crisisEndDay}
                  onChange={(e) => setCrisisEndDay(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateCrisisOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCrisis}>
              Create Crisis Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
