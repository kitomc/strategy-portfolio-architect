import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Portfolio, Strategy } from '@/types';

/**
 * Exports a portfolio as a ZIP file with strategies organized by symbol/timeframe
 */
export async function exportPortfolio(portfolio: Portfolio): Promise<void> {
  const zip = new JSZip();
  
  // Group strategies by symbol and timeframe
  const grouped: Record<string, Record<string, Strategy[]>> = {};
  
  portfolio.members.forEach(strategy => {
    const symbol = strategy.dataId.symbol;
    const timeframe = strategy.dataId.period;
    
    if (!grouped[symbol]) {
      grouped[symbol] = {};
    }
    if (!grouped[symbol][timeframe]) {
      grouped[symbol][timeframe] = [];
    }
    
    grouped[symbol][timeframe].push(strategy);
  });
  
  // Create ZIP structure: SYMBOL/TIMEFRAME/strategy-uuid.json
  Object.entries(grouped).forEach(([symbol, timeframes]) => {
    Object.entries(timeframes).forEach(([timeframe, strategies]) => {
      strategies.forEach((strategy, index) => {
        const filename = `strategy-${generateUUID()}.json`;
        const filepath = `${symbol}/${timeframe}/${filename}`;
        
        // Preserve the original structure exactly as it was imported
        const exportData = {
          dataId: strategy.dataId,
          equity: strategy.equity,
          balance: strategy.balance,
          backtestStats: strategy.backtestStats,
          strategy: strategy.strategy,
          ...(strategy.openFilters && { openFilters: strategy.openFilters }),
          ...(strategy.closeFilters && { closeFilters: strategy.closeFilters })
        };
        
        zip.file(filepath, JSON.stringify(exportData, null, 2));
      });
    });
  });
  
  // Add portfolio metadata
  const metadata = {
    portfolioName: portfolio.name,
    createdAt: portfolio.createdAt,
    exportedAt: new Date(),
    strategyCount: portfolio.members.length,
    symbols: [...new Set(portfolio.members.map(s => s.dataId.symbol))],
    timeframes: [...new Set(portfolio.members.map(s => s.dataId.period))]
  };
  
  zip.file('portfolio-info.json', JSON.stringify(metadata, null, 2));
  
  // Generate and save the ZIP file
  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    const fileName = `${sanitizeFileName(portfolio.name)}-${formatDate(new Date())}.zip`;
    saveAs(blob, fileName);
  } catch (error) {
    throw new Error(`Failed to generate ZIP file: ${error}`);
  }
}

/**
 * Exports individual strategies as separate JSON files in a ZIP
 */
export async function exportStrategies(strategies: Strategy[], fileName: string = 'strategies'): Promise<void> {
  const zip = new JSZip();
  
  strategies.forEach((strategy, index) => {
    const strategyFileName = `${strategy.dataId.symbol}_${strategy.dataId.period}_${index + 1}.json`;
    
    const exportData = {
      dataId: strategy.dataId,
      equity: strategy.equity,
      balance: strategy.balance,
      backtestStats: strategy.backtestStats,
      strategy: strategy.strategy,
      ...(strategy.openFilters && { openFilters: strategy.openFilters }),
      ...(strategy.closeFilters && { closeFilters: strategy.closeFilters })
    };
    
    zip.file(strategyFileName, JSON.stringify(exportData, null, 2));
  });
  
  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    const zipFileName = `${sanitizeFileName(fileName)}-${formatDate(new Date())}.zip`;
    saveAs(blob, zipFileName);
  } catch (error) {
    throw new Error(`Failed to generate ZIP file: ${error}`);
  }
}

/**
 * Exports portfolio statistics to CSV
 */
export function exportPortfolioStatsCSV(portfolio: Portfolio): void {
  const headers = [
    'Symbol',
    'Timeframe', 
    'Profit Factor',
    'Max Drawdown (%)',
    'SQN',
    'Win Rate (%)',
    'Total Return (%)'
  ];
  
  const rows = portfolio.members.map(strategy => [
    strategy.dataId.symbol,
    strategy.dataId.period,
    strategy.backtestStats.profitFactor.toFixed(2),
    Math.abs(strategy.backtestStats.maxDrawdown).toFixed(2),
    strategy.backtestStats.sqn.toFixed(2),
    strategy.backtestStats.winRate.toFixed(1),
    strategy.backtestStats.totalReturn.toFixed(2)
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = `${sanitizeFileName(portfolio.name)}-stats-${formatDate(new Date())}.csv`;
  saveAs(blob, fileName);
}

// Utility functions
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-z0-9\-_]/gi, '_').toLowerCase();
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}