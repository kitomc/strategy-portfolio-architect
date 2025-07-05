// Core types for trading strategy portfolio analyzer

export interface DataId {
  symbol: string;
  period: string;
}

export interface BacktestStats {
  profitFactor: number;
  maxDrawdown: number;
  sqn: number;
  totalReturn: number;
  winRate: number;
  sharpeRatio?: number;
  [key: string]: number | undefined;
}

export interface Strategy {
  dataId: DataId;
  equity: number[];
  balance: number[];
  backtestStats: BacktestStats;
  strategy: any; // Preserve original structure for export
  openFilters?: any;
  closeFilters?: any;
  id?: string; // Added for internal tracking
}

export interface Portfolio {
  id: string;
  name: string;
  members: Strategy[];
  createdAt: Date;
  totalEquity?: number[];
  correlationMatrix?: number[][];
}

export interface CorrelationPair {
  strategyA: string;
  strategyB: string;
  correlation: number;
  risk: 'low' | 'medium' | 'high';
}

export interface UploadedFile {
  name: string;
  strategies: Strategy[];
  uploadedAt: Date;
}

export interface FilterOptions {
  symbol?: string;
  period?: string;
  minProfitFactor?: number;
  maxDrawdown?: number;
  minSQN?: number;
  minWinRate?: number;
}