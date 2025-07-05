import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { usePortfolioStore } from '@/store/portfolioStore';
import { exportPortfolio, exportStrategies, exportPortfolioStatsCSV } from '@/utils/exporter';
import { calculatePortfolioStats } from '@/utils/stats';
import { 
  Save, 
  Download, 
  FileDown, 
  TrendingUp, 
  Shield, 
  Target,
  Percent
} from 'lucide-react';

export function PortfolioActions() {
  const { 
    getSelectedStrategiesData, 
    createPortfolio, 
    clearSelection, 
    selectedStrategies 
  } = usePortfolioStore();
  
  const [portfolioName, setPortfolioName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const selectedData = getSelectedStrategiesData();
  const portfolioStats = calculatePortfolioStats(selectedData);

  const handleCreatePortfolio = async () => {
    if (!portfolioName.trim()) {
      toast({
        title: "Portfolio Name Required",
        description: "Please enter a name for your portfolio.",
        variant: "destructive",
      });
      return;
    }

    if (selectedData.length === 0) {
      toast({
        title: "No Strategies Selected",
        description: "Please select at least one strategy.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      createPortfolio(portfolioName);
      toast({
        title: "Portfolio Created!",
        description: `${portfolioName} has been saved with ${selectedData.length} strategies.`,
      });
      setPortfolioName('');
    } catch (error) {
      toast({
        title: "Failed to Create Portfolio",
        description: "An error occurred while creating the portfolio.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleExportStrategies = async () => {
    if (selectedData.length === 0) {
      toast({
        title: "No Strategies Selected",
        description: "Please select strategies to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      await exportStrategies(selectedData, portfolioName || 'selected-strategies');
      toast({
        title: "Export Successful!",
        description: `${selectedData.length} strategies exported as ZIP file.`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting strategies.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportStats = async () => {
    if (selectedData.length === 0) {
      toast({
        title: "No Strategies Selected",
        description: "Please select strategies to export stats.",
        variant: "destructive",
      });
      return;
    }

    try {
      const portfolio = {
        id: 'temp',
        name: portfolioName || 'portfolio-stats',
        members: selectedData,
        createdAt: new Date()
      };
      
      exportPortfolioStatsCSV(portfolio);
      toast({
        title: "Stats Exported!",
        description: "Portfolio statistics exported as CSV file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting statistics.",
        variant: "destructive",
      });
    }
  };

  if (selectedData.length === 0) {
    return (
      <Card className="bg-gradient-background shadow-card">
        <CardContent className="p-8 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Build Your Portfolio</h3>
          <p className="text-muted-foreground">
            Select strategies from the library to create and analyze your portfolio.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Statistics */}
      <Card className="bg-gradient-background shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Portfolio Statistics
            <Badge variant="secondary" className="px-2 py-1">
              {selectedData.length} strategies
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-profit" />
              <div className="text-sm text-muted-foreground">Total Return</div>
              <div className={`text-lg font-bold ${portfolioStats.totalReturn >= 0 ? 'text-profit' : 'text-loss'}`}>
                {portfolioStats.totalReturn >= 0 ? '+' : ''}{portfolioStats.totalReturn.toFixed(1)}%
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Shield className="w-5 h-5 mx-auto mb-2 text-warning" />
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
              <div className="text-lg font-bold text-loss">
                {portfolioStats.maxDrawdown.toFixed(1)}%
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Target className="w-5 h-5 mx-auto mb-2 text-primary" />
              <div className="text-sm text-muted-foreground">Avg Profit Factor</div>
              <div className="text-lg font-bold">
                {portfolioStats.profitFactor.toFixed(2)}
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-muted/30">
              <Percent className="w-5 h-5 mx-auto mb-2 text-accent" />
              <div className="text-sm text-muted-foreground">Avg Win Rate</div>
              <div className="text-lg font-bold">
                {portfolioStats.winRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Actions */}
      <Card className="bg-gradient-background shadow-card">
        <CardHeader>
          <CardTitle>Portfolio Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Save Portfolio */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter portfolio name..."
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleCreatePortfolio}
              disabled={isCreating || !portfolioName.trim()}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
            >
              <Save className="w-4 h-4 mr-2" />
              {isCreating ? 'Saving...' : 'Save Portfolio'}
            </Button>
          </div>

          {/* Export Options */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline"
              onClick={handleExportStrategies}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export ZIP'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleExportStats}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            
            <Button 
              variant="ghost"
              onClick={clearSelection}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear Selection
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>• ZIP export preserves original EA Studio format for MT4/MT5 import</p>
            <p>• CSV export includes all strategy statistics for external analysis</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}