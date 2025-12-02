import React from 'react';
import { Button } from './ui/button';
import { TrendingUp, Shield, BarChart3, Users } from 'lucide-react';

interface LandingPageProps {
  onEnterSimulation: () => void;
  onAdminLogin: () => void;
}

export function LandingPage({ onEnterSimulation, onAdminLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl mb-4 text-gray-900">Behavioral Finance Market Simulator</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience realistic crisis-driven stock trading and analyze your behavioral patterns in a controlled simulation environment
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <TrendingUp className="size-12 text-blue-600 mb-4" />
            <h3 className="mb-2 text-gray-900">Real NSE Data</h3>
            <p className="text-sm text-gray-600">Simulations based on actual Monday NSE prices for realistic trading</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Shield className="size-12 text-green-600 mb-4" />
            <h3 className="mb-2 text-gray-900">Crisis Events</h3>
            <p className="text-sm text-gray-600">Admins inject sector-specific crisis events to study market reactions</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <BarChart3 className="size-12 text-purple-600 mb-4" />
            <h3 className="mb-2 text-gray-900">Behavior Analytics</h3>
            <p className="text-sm text-gray-600">Track panic sells, FOMO buys, and reaction times with detailed logs</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Users className="size-12 text-orange-600 mb-4" />
            <h3 className="mb-2 text-gray-900">Weekly Reports</h3>
            <p className="text-sm text-gray-600">Comprehensive weekly summaries with insights and performance metrics</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-16 max-w-4xl mx-auto">
          <h2 className="text-3xl mb-6 text-center text-gray-900">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 size-8 bg-blue-600 text-white rounded-full flex items-center justify-center">1</div>
              <div>
                <h4 className="text-gray-900 mb-1">Monday Baseline</h4>
                <p className="text-sm text-gray-600">Admin imports real NSE stock prices to establish the simulation baseline</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 size-8 bg-blue-600 text-white rounded-full flex items-center justify-center">2</div>
              <div>
                <h4 className="text-gray-900 mb-1">Crisis Injection</h4>
                <p className="text-sm text-gray-600">Admin creates crisis events targeting specific sectors with impact parameters</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 size-8 bg-blue-600 text-white rounded-full flex items-center justify-center">3</div>
              <div>
                <h4 className="text-gray-900 mb-1">5-Day Simulation</h4>
                <p className="text-sm text-gray-600">System generates crisis-affected prices for 5 trading days</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 size-8 bg-blue-600 text-white rounded-full flex items-center justify-center">4</div>
              <div>
                <h4 className="text-gray-900 mb-1">User Trading</h4>
                <p className="text-sm text-gray-600">Users buy and sell stocks while the system logs all behavioral patterns</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 size-8 bg-blue-600 text-white rounded-full flex items-center justify-center">5</div>
              <div>
                <h4 className="text-gray-900 mb-1">Weekly Analysis</h4>
                <p className="text-sm text-gray-600">System generates comprehensive behavioral reports with insights and trends</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={onEnterSimulation} 
            size="lg"
            className="w-64"
          >
            Enter Simulation
          </Button>
          <Button 
            onClick={onAdminLogin} 
            variant="outline" 
            size="lg"
            className="w-64"
          >
            Admin Login
          </Button>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>This is a simulation environment for behavioral finance research.</p>
          <p>No real money or actual trading is involved.</p>
        </div>
      </div>
    </div>
  );
}
