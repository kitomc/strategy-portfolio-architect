import { Strategy, CorrelationPair } from '@/types';

/**
 * Calculates Pearson correlation coefficient between two arrays
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  
  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);
  
  const sumX = xSlice.reduce((a, b) => a + b, 0);
  const sumY = ySlice.reduce((a, b) => a + b, 0);
  const sumXY = xSlice.reduce((sum, xi, i) => sum + xi * ySlice[i], 0);
  const sumXX = xSlice.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = ySlice.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculates daily returns from equity curve
 */
export function calculateDailyReturns(equity: number[]): number[] {
  if (equity.length < 2) return [];
  
  const returns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    if (equity[i-1] !== 0) {
      returns.push((equity[i] - equity[i-1]) / equity[i-1]);
    } else {
      returns.push(0);
    }
  }
  return returns;
}

/**
 * Merges equity curves from multiple strategies
 */
export function mergeEquityCurves(strategies: Strategy[]): number[] {
  if (strategies.length === 0) return [];
  
  // Find the longest equity curve length
  const maxLength = Math.max(...strategies.map(s => s.equity.length));
  const merged = Array(maxLength).fill(0);
  
  // Sum all equity curves, handling different lengths
  strategies.forEach(strategy => {
    const baseEquity = strategy.equity[0] || 0;
    strategy.equity.forEach((equity, index) => {
      if (index < merged.length) {
        // Add the change from baseline, not absolute equity
        merged[index] += (equity - baseEquity);
      }
    });
  });
  
  // Convert back to cumulative equity curve starting from initial balance
  const initialBalance = 100000; // Standard starting balance
  return merged.map((change, index) => initialBalance + change);
}

/**
 * Calculates correlation matrix for multiple strategies
 */
export function calculateCorrelationMatrix(strategies: Strategy[]): number[][] {
  const n = strategies.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  // Calculate daily returns for each strategy
  const allReturns = strategies.map(strategy => calculateDailyReturns(strategy.equity));
  
  // Calculate correlations
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1; // Perfect correlation with itself
      } else {
        matrix[i][j] = calculateCorrelation(allReturns[i], allReturns[j]);
      }
    }
  }
  
  return matrix;
}

/**
 * Identifies correlation pairs with risk assessment
 */
export function analyzeCorrelations(strategies: Strategy[]): CorrelationPair[] {
  if (strategies.length < 2) return [];
  
  const correlationMatrix = calculateCorrelationMatrix(strategies);
  const pairs: CorrelationPair[] = [];
  
  for (let i = 0; i < strategies.length; i++) {
    for (let j = i + 1; j < strategies.length; j++) {
      const correlation = Math.abs(correlationMatrix[i][j]);
      const strategyA = `${strategies[i].dataId.symbol} ${strategies[i].dataId.period}`;
      const strategyB = `${strategies[j].dataId.symbol} ${strategies[j].dataId.period}`;
      
      let risk: 'low' | 'medium' | 'high';
      if (correlation < 0.3) {
        risk = 'low';
      } else if (correlation < 0.7) {
        risk = 'medium';
      } else {
        risk = 'high';
      }
      
      pairs.push({
        strategyA,
        strategyB,
        correlation,
        risk
      });
    }
  }
  
  return pairs.sort((a, b) => b.correlation - a.correlation);
}

/**
 * Calculates portfolio statistics
 */
export function calculatePortfolioStats(strategies: Strategy[]) {
  if (strategies.length === 0) {
    return {
      totalReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      profitFactor: 1,
      winRate: 0,
      strategyCount: 0
    };
  }
  
  const mergedEquity = mergeEquityCurves(strategies);
  const returns = calculateDailyReturns(mergedEquity);
  
  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = mergedEquity[0];
  
  for (const equity of mergedEquity) {
    if (equity > peak) {
      peak = equity;
    }
    const drawdown = (peak - equity) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  // Calculate return metrics
  const totalReturn = mergedEquity.length > 0 
    ? (mergedEquity[mergedEquity.length - 1] - mergedEquity[0]) / mergedEquity[0]
    : 0;
  
  // Simple Sharpe ratio approximation (assuming risk-free rate = 0)
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const returnStdDev = Math.sqrt(
    returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / (returns.length - 1)
  );
  const sharpeRatio = returnStdDev !== 0 ? avgReturn / returnStdDev : 0;
  
  // Average metrics from individual strategies
  const avgProfitFactor = strategies.reduce((sum, s) => sum + s.backtestStats.profitFactor, 0) / strategies.length;
  const avgWinRate = strategies.reduce((sum, s) => sum + s.backtestStats.winRate, 0) / strategies.length;
  
  return {
    totalReturn: totalReturn * 100, // Convert to percentage
    maxDrawdown: maxDrawdown * 100, // Convert to percentage
    sharpeRatio,
    profitFactor: avgProfitFactor,
    winRate: avgWinRate,
    strategyCount: strategies.length
  };
}