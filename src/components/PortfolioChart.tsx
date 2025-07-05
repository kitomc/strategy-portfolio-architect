import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePortfolioStore } from '@/store/portfolioStore';
import { mergeEquityCurves } from '@/utils/stats';
import { Strategy } from '@/types';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';

interface ChartDataPoint {
  index: number;
  portfolio: number;
  [key: string]: number;
}

export function PortfolioChart() {
  const { getSelectedStrategiesData } = usePortfolioStore();
  const selectedStrategies = getSelectedStrategiesData();
  
  const [showIndividual, setShowIndividual] = useState(false);
  const [visibleStrategies, setVisibleStrategies] = useState<Set<string>>(new Set());

  const chartData = useMemo(() => {
    if (selectedStrategies.length === 0) return [];

    const portfolioEquity = mergeEquityCurves(selectedStrategies);
    const maxLength = Math.max(...selectedStrategies.map(s => s.equity.length));
    
    const data: ChartDataPoint[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const dataPoint: ChartDataPoint = {
        index: i,
        portfolio: portfolioEquity[i] || portfolioEquity[portfolioEquity.length - 1] || 100000,
      };
      
      // Add individual strategy data if enabled
      if (showIndividual) {
        selectedStrategies.forEach(strategy => {
          const key = `${strategy.dataId.symbol}_${strategy.dataId.period}`;
          dataPoint[key] = strategy.equity[i] || strategy.equity[strategy.equity.length - 1] || 100000;
        });
      }
      
      data.push(dataPoint);
    }
    
    return data;
  }, [selectedStrategies, showIndividual]);

  const toggleStrategyVisibility = (strategyKey: string) => {
    const newVisible = new Set(visibleStrategies);
    if (newVisible.has(strategyKey)) {
      newVisible.delete(strategyKey);
    } else {
      newVisible.add(strategyKey);
    }
    setVisibleStrategies(newVisible);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStrategyColor = (index: number) => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
      '#d084d0', '#ffb347', '#87ceeb', '#98fb98', '#f0e68c'
    ];
    return colors[index % colors.length];
  };

  if (selectedStrategies.length === 0) {
    return (
      <Card className="bg-gradient-background shadow-card">
        <CardContent className="p-8 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Portfolio Selected</h3>
          <p className="text-muted-foreground">
            Select strategies from the library to build your portfolio and see the combined equity curve.
          </p>
        </CardContent>
      </Card>
    );
  }

  const portfolioValue = chartData.length > 0 ? chartData[chartData.length - 1].portfolio : 100000;
  const totalReturn = ((portfolioValue - 100000) / 100000) * 100;

  return (
    <Card className="bg-gradient-background shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Portfolio Equity Curve
              <Badge variant="secondary" className="px-2 py-1">
                {selectedStrategies.length} strategies
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-sm text-muted-foreground">
                Current Value: <span className="font-medium text-foreground">{formatCurrency(portfolioValue)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Total Return: <span className={`font-medium ${totalReturn >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="show-individual"
              checked={showIndividual}
              onCheckedChange={setShowIndividual}
            />
            <Label htmlFor="show-individual" className="text-sm">
              Show Individual Strategies
            </Label>
          </div>
        </div>

        {showIndividual && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {selectedStrategies.map((strategy, index) => {
              const key = `${strategy.dataId.symbol}_${strategy.dataId.period}`;
              const isVisible = visibleStrategies.has(key);
              return (
                <Button
                  key={key}
                  variant={isVisible ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleStrategyVisibility(key)}
                  className="h-7 text-xs"
                >
                  {isVisible ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  {strategy.dataId.symbol} {strategy.dataId.period}
                </Button>
              );
            })}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="index"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'portfolio' ? 'Portfolio Total' : name.replace('_', ' ')
                ]}
                labelFormatter={(label) => `Bar ${label}`}
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              
              {/* Portfolio line - always shown */}
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={false}
                name="Portfolio Total"
              />
              
              {/* Individual strategy lines - shown when enabled and visible */}
              {showIndividual && selectedStrategies.map((strategy, index) => {
                const key = `${strategy.dataId.symbol}_${strategy.dataId.period}`;
                const isVisible = visibleStrategies.has(key);
                
                if (!isVisible) return null;
                
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={getStrategyColor(index)}
                    strokeWidth={1.5}
                    dot={false}
                    name={key.replace('_', ' ')}
                    opacity={0.7}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}