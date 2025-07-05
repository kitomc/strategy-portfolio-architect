import { FileUpload } from '@/components/FileUpload';
import { StrategyTable } from '@/components/StrategyTable';

export default function Library() {
  return (
    <div className="min-h-screen bg-gradient-background p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <FileUpload />
        <StrategyTable />
      </div>
    </div>
  );
}