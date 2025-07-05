import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePortfolioStore } from '@/store/portfolioStore';
import { cn } from '@/lib/utils';

export function Navigation() {
  const { activeTab, setActiveTab, allStrategies, selectedStrategies } = usePortfolioStore();

  return (
    <Card className="p-1 bg-gradient-background shadow-card">
      <div className="flex gap-1">
        <Button
          variant={activeTab === 'library' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('library')}
          className={cn(
            "flex-1 transition-all duration-200",
            activeTab === 'library' 
              ? "bg-gradient-primary text-primary-foreground shadow-glow" 
              : "hover:bg-muted"
          )}
        >
          Strategy Library
          <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
            {allStrategies.length}
          </span>
        </Button>
        
        <Button
          variant={activeTab === 'portfolio' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('portfolio')}
          className={cn(
            "flex-1 transition-all duration-200",
            activeTab === 'portfolio' 
              ? "bg-gradient-primary text-primary-foreground shadow-glow" 
              : "hover:bg-muted"
          )}
        >
          Portfolio Builder
          <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
            {selectedStrategies.length}
          </span>
        </Button>
      </div>
    </Card>
  );
}