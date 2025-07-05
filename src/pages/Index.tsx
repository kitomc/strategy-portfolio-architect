import { Navigation } from '@/components/Navigation';
import { usePortfolioStore } from '@/store/portfolioStore';
import Library from './Library';
import Portfolio from './Portfolio';

const Index = () => {
  const activeTab = usePortfolioStore(state => state.activeTab);

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Trading Strategy Portfolio Analyzer
          </h1>
          <Navigation />
        </div>
      </div>
      
      {activeTab === 'library' ? <Library /> : <Portfolio />}
    </div>
  );
};

export default Index;
