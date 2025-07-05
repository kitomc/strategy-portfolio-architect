import { PortfolioChart } from '@/components/PortfolioChart';
import { CorrelationMatrix } from '@/components/CorrelationMatrix';
import { PortfolioActions } from '@/components/PortfolioActions';

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-gradient-background p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <PortfolioChart />
            <CorrelationMatrix />
          </div>
          <div>
            <PortfolioActions />
          </div>
        </div>
      </div>
    </div>
  );
}