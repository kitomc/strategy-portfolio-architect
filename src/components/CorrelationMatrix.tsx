import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePortfolioStore } from '@/store/portfolioStore';
import { calculateCorrelationMatrix, analyzeCorrelations } from '@/utils/stats';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

export function CorrelationMatrix() {
  const { getSelectedStrategiesData } = usePortfolioStore();
  const selectedStrategies = getSelectedStrategiesData();

  const { correlationMatrix, correlationPairs } = useMemo(() => {
    if (selectedStrategies.length < 2) {
      return { correlationMatrix: [], correlationPairs: [] };
    }

    const matrix = calculateCorrelationMatrix(selectedStrategies);
    const pairs = analyzeCorrelations(selectedStrategies);

    return { correlationMatrix: matrix, correlationPairs: pairs };
  }, [selectedStrategies]);

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs < 0.3) return 'bg-profit/20 text-profit-foreground border-profit/30';
    if (abs < 0.7) return 'bg-warning/20 text-warning-foreground border-warning/30';
    return 'bg-loss/20 text-loss-foreground border-loss/30';
  };

  const getCorrelationIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="w-3 h-3 text-profit" />;
      case 'medium': return <AlertCircle className="w-3 h-3 text-warning" />;
      case 'high': return <AlertTriangle className="w-3 h-3 text-loss" />;
      default: return null;
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  if (selectedStrategies.length < 2) {
    return (
      <Card className="bg-gradient-background shadow-card">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Need More Strategies</h3>
          <p className="text-muted-foreground">
            Select at least 2 strategies to analyze correlations and diversification risk.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Correlation Risk Summary */}
      <Card className="bg-gradient-background shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Correlation Risk Analysis
            <Badge variant="secondary" className="px-2 py-1">
              {correlationPairs.length} pairs analyzed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {correlationPairs.slice(0, 5).map((pair, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getCorrelationColor(pair.correlation)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getCorrelationIcon(pair.risk)}
                    <span className="text-sm font-medium">
                      {pair.strategyA} ↔ {pair.strategyB}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRiskBadgeVariant(pair.risk)} className="text-xs">
                      {pair.risk} risk
                    </Badge>
                    <span className="text-sm font-mono">
                      {(pair.correlation * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {correlationPairs.length > 5 && (
              <div className="text-center py-2">
                <span className="text-sm text-muted-foreground">
                  +{correlationPairs.length - 5} more pairs
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Correlation Matrix */}
      <Card className="bg-gradient-background shadow-card">
        <CardHeader>
          <CardTitle>Correlation Matrix</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-profit/20 border border-profit/30 rounded"></div>
              <span>Low (&lt;0.3)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-warning/20 border border-warning/30 rounded"></div>
              <span>Medium (0.3-0.7)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-loss/20 border border-loss/30 rounded"></div>
              <span>High (&gt;0.7)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-max">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-xs font-medium text-muted-foreground"></th>
                    {selectedStrategies.map((strategy, index) => (
                      <th
                        key={index}
                        className="p-2 text-center text-xs font-medium text-muted-foreground"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                      >
                        {strategy.dataId.symbol} {strategy.dataId.period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedStrategies.map((strategyA, i) => (
                    <tr key={i}>
                      <td className="p-2 text-xs font-medium text-muted-foreground">
                        {strategyA.dataId.symbol} {strategyA.dataId.period}
                      </td>
                      {selectedStrategies.map((strategyB, j) => {
                        const correlation = correlationMatrix[i]?.[j] || 0;
                        const absCorrelation = Math.abs(correlation);
                        
                        return (
                          <td key={j} className="p-1">
                            <div
                              className={`
                                w-12 h-8 flex items-center justify-center text-xs font-mono rounded border
                                ${i === j ? 'bg-primary/20 border-primary/30' : getCorrelationColor(correlation)}
                              `}
                            >
                              {i === j ? '1.0' : (correlation * 100).toFixed(0)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}