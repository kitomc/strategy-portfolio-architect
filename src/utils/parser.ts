import { Strategy, UploadedFile } from '@/types';

export class ParseError extends Error {
  constructor(message: string, public fileName?: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export async function parseStrategyFile(file: File): Promise<UploadedFile> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Handle both single strategy object and array of strategies
    const strategiesArray = Array.isArray(data) ? data : [data];
    
    const strategies: Strategy[] = strategiesArray.map((item, index) => {
      return validateAndNormalizeStrategy(item, `${file.name}[${index}]`);
    });
    
    return {
      name: file.name,
      strategies,
      uploadedAt: new Date()
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ParseError(`Invalid JSON format in file: ${file.name}`, file.name);
    }
    throw error;
  }
}

function validateAndNormalizeStrategy(data: any, context: string): Strategy {
  // Validate required fields
  if (!data.dataId || typeof data.dataId !== 'object') {
    throw new ParseError(`Missing or invalid dataId in ${context}`);
  }
  
  if (!data.dataId.symbol || !data.dataId.period) {
    throw new ParseError(`Missing symbol or period in dataId for ${context}`);
  }
  
  if (!Array.isArray(data.equity) || !Array.isArray(data.balance)) {
    throw new ParseError(`Missing or invalid equity/balance arrays in ${context}`);
  }
  
  if (!data.backtestStats || typeof data.backtestStats !== 'object') {
    throw new ParseError(`Missing or invalid backtestStats in ${context}`);
  }
  
  // Normalize backtest stats - handle different naming conventions
  const backtestStats = normalizeBacktestStats(data.backtestStats);
  
  return {
    dataId: {
      symbol: data.dataId.symbol.toString().toUpperCase(),
      period: data.dataId.period.toString()
    },
    equity: data.equity.map(Number),
    balance: data.balance.map(Number),
    backtestStats,
    strategy: data.strategy || {},
    openFilters: data.openFilters,
    closeFilters: data.closeFilters
  };
}

function normalizeBacktestStats(stats: any): any {
  // Common field mappings for different EA Studio export formats
  const fieldMappings: Record<string, string[]> = {
    profitFactor: ['profitFactor', 'profit_factor', 'ProfitFactor', 'PF'],
    maxDrawdown: ['maxDrawdown', 'max_drawdown', 'MaxDrawdown', 'DD', 'drawdown'],
    sqn: ['sqn', 'SQN', 'systemQualityNumber'],
    totalReturn: ['totalReturn', 'total_return', 'TotalReturn', 'return'],
    winRate: ['winRate', 'win_rate', 'WinRate', 'winningRate', 'winning_rate']
  };
  
  const normalized: any = {};
  
  // Map known fields
  Object.entries(fieldMappings).forEach(([standardKey, possibleKeys]) => {
    for (const key of possibleKeys) {
      if (stats[key] !== undefined) {
        normalized[standardKey] = Number(stats[key]);
        break;
      }
    }
  });
  
  // Set defaults for missing critical stats
  normalized.profitFactor = normalized.profitFactor ?? 1;
  normalized.maxDrawdown = normalized.maxDrawdown ?? 0;
  normalized.sqn = normalized.sqn ?? 0;
  normalized.totalReturn = normalized.totalReturn ?? 0;
  normalized.winRate = normalized.winRate ?? 50;
  
  // Keep all original stats for reference
  Object.keys(stats).forEach(key => {
    if (stats[key] !== undefined) {
      normalized[key] = Number(stats[key]);
    }
  });
  
  return normalized;
}

export function validateFileBeforeUpload(file: File): string[] {
  const errors: string[] = [];
  
  // Check file type
  if (!file.name.toLowerCase().endsWith('.json')) {
    errors.push('File must have .json extension');
  }
  
  // Check file size (max 50MB)
  if (file.size > 50 * 1024 * 1024) {
    errors.push('File size must be less than 50MB');
  }
  
  return errors;
}

export async function parseMultipleFiles(files: FileList | File[]): Promise<UploadedFile[]> {
  const results: UploadedFile[] = [];
  const errors: string[] = [];
  
  for (const file of Array.from(files)) {
    try {
      const validationErrors = validateFileBeforeUpload(file);
      if (validationErrors.length > 0) {
        errors.push(`${file.name}: ${validationErrors.join(', ')}`);
        continue;
      }
      
      const parsed = await parseStrategyFile(file);
      results.push(parsed);
    } catch (error) {
      if (error instanceof ParseError) {
        errors.push(error.message);
      } else {
        errors.push(`${file.name}: Unexpected error - ${error}`);
      }
    }
  }
  
  if (errors.length > 0 && results.length === 0) {
    throw new ParseError(`Failed to parse any files:\n${errors.join('\n')}`);
  }
  
  if (errors.length > 0) {
    console.warn('Some files failed to parse:', errors);
  }
  
  return results;
}
