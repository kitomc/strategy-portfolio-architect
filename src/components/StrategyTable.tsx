import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePortfolioStore } from '@/store/portfolioStore';
import { Strategy } from '@/types';
import { Search, Filter, TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

type SortField = 'symbol' | 'period' | 'profitFactor' | 'maxDrawdown' | 'sqn' | 'winRate' | 'totalReturn';
type SortDirection = 'asc' | 'desc';

export function StrategyTable() {
  const {
    getFilteredStrategies,
    selectedStrategies,
    addToSelection,
    removeFromSelection,
    filters,
    setFilters,
    allStrategies
  } = usePortfolioStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('profitFactor');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const strategies = getFilteredStrategies()
    .filter(strategy =>
      strategy.dataId.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      strategy.dataId.period.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'symbol':
          aValue = a.dataId.symbol;
          bValue = b.dataId.symbol;
          break;
        case 'period':
          aValue = a.dataId.period;
          bValue = b.dataId.period;
          break;
        case 'profitFactor':
          aValue = a.backtestStats.profitFactor;
          bValue = b.backtestStats.profitFactor;
          break;
        case 'maxDrawdown':
          aValue = Math.abs(a.backtestStats.maxDrawdown);
          bValue = Math.abs(b.backtestStats.maxDrawdown);
          break;
        case 'sqn':
          aValue = a.backtestStats.sqn;
          bValue = b.backtestStats.sqn;
          break;
        case 'winRate':
          aValue = a.backtestStats.winRate;
          bValue = b.backtestStats.winRate;
          break;
        case 'totalReturn':
          aValue = a.backtestStats.totalReturn;
          bValue = b.backtestStats.totalReturn;
          break;
        default:
          aValue = a.backtestStats.profitFactor;
          bValue = b.backtestStats.profitFactor;
      }
      
      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const uniqueSymbols = [...new Set(allStrategies.map(s => s.dataId.symbol))].sort();
  const uniquePeriods = [...new Set(allStrategies.map(s => s.dataId.period))].sort();

  const formatNumber = (num: number, decimals = 2) => {
    return num.toFixed(decimals);
  };

  const getPerformanceColor = (value: number, isPositive = true) => {
    if (isPositive) {
      return value > 0 ? 'text-profit' : 'text-loss';
    }
    return value < 0 ? 'text-profit' : 'text-loss';
  };

  const handleStrategyToggle = (strategy: Strategy) => {
    if (selectedStrategies.includes(strategy.id!)) {
      removeFromSelection(strategy.id!);
    } else {
      addToSelection(strategy.id!);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for numeric fields
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-primary" />
      : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/30 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  return (
    <Card className="bg-gradient-background shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Strategy Library
            <Badge variant="secondary" className="px-2 py-1">
              {strategies.length} strategies
            </Badge>
          </CardTitle>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 pt-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by symbol or timeframe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filters.symbol || 'all'} onValueChange={(value) => 
            setFilters({ ...filters, symbol: value === 'all' ? undefined : value })
          }>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Symbols</SelectItem>
              {uniqueSymbols.map(symbol => (
                <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.period || 'all'} onValueChange={(value) => 
            setFilters({ ...filters, period: value === 'all' ? undefined : value })
          }>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {uniquePeriods.map(period => (
                <SelectItem key={period} value={period}>{period}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilters({})}
            disabled={Object.keys(filters).length === 0}
          >
            <Filter className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">Select</TableHead>
                <SortableHeader field="symbol">Symbol</SortableHeader>
                <SortableHeader field="period">Timeframe</SortableHeader>
                <SortableHeader field="profitFactor">
                  <div className="text-right w-full">Profit Factor</div>
                </SortableHeader>
                <SortableHeader field="maxDrawdown">
                  <div className="text-right w-full">Max DD (%)</div>
                </SortableHeader>
                <SortableHeader field="sqn">
                  <div className="text-right w-full">SQN</div>
                </SortableHeader>
                <SortableHeader field="winRate">
                  <div className="text-right w-full">Win Rate (%)</div>
                </SortableHeader>
                <SortableHeader field="totalReturn">
                  <div className="text-right w-full">Total Return (%)</div>
                </SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {strategies.map((strategy) => (
                <TableRow 
                  key={strategy.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    selectedStrategies.includes(strategy.id!) ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedStrategies.includes(strategy.id!)}
                      onCheckedChange={() => handleStrategyToggle(strategy)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {strategy.dataId.symbol}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {strategy.dataId.period}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 ${
                      strategy.backtestStats.profitFactor > 1.5 ? 'text-profit' : 
                      strategy.backtestStats.profitFactor < 1.2 ? 'text-loss' : 'text-warning'
                    }`}>
                      {strategy.backtestStats.profitFactor > 1.2 ? 
                        <TrendingUp className="w-3 h-3" /> : 
                        <TrendingDown className="w-3 h-3" />
                      }
                      {formatNumber(strategy.backtestStats.profitFactor)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={getPerformanceColor(strategy.backtestStats.maxDrawdown, false)}>
                      {formatNumber(Math.abs(strategy.backtestStats.maxDrawdown))}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={getPerformanceColor(strategy.backtestStats.sqn)}>
                      {formatNumber(strategy.backtestStats.sqn)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={getPerformanceColor(strategy.backtestStats.winRate - 50)}>
                      {formatNumber(strategy.backtestStats.winRate, 1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={getPerformanceColor(strategy.backtestStats.totalReturn)}>
                      {formatNumber(strategy.backtestStats.totalReturn)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {strategies.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No strategies found</p>
              <p className="text-sm">Try adjusting your filters or uploading more strategy files</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}