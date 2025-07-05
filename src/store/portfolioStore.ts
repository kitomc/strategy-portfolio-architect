import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Strategy, Portfolio, UploadedFile, FilterOptions } from '@/types';

interface PortfolioState {
  // Data
  uploadedFiles: UploadedFile[];
  allStrategies: Strategy[];
  portfolios: Portfolio[];
  selectedStrategies: string[];
  currentPortfolio: Portfolio | null;
  
  // UI State
  activeTab: 'library' | 'portfolio';
  filters: FilterOptions;
  
  // Actions
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (fileName: string) => void;
  setSelectedStrategies: (strategyIds: string[]) => void;
  addToSelection: (strategyId: string) => void;
  removeFromSelection: (strategyId: string) => void;
  clearSelection: () => void;
  
  // Portfolio actions
  createPortfolio: (name: string) => void;
  savePortfolio: (portfolio: Portfolio) => void;
  deletePortfolio: (portfolioId: string) => void;
  setCurrentPortfolio: (portfolioId: string | null) => void;
  
  // Filter actions  
  setFilters: (filters: FilterOptions) => void;
  clearFilters: () => void;
  
  // UI actions
  setActiveTab: (tab: 'library' | 'portfolio') => void;
  
  // Computed
  getFilteredStrategies: () => Strategy[];
  getSelectedStrategiesData: () => Strategy[];
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      // Initial state
      uploadedFiles: [],
      allStrategies: [],
      portfolios: [],
      selectedStrategies: [],
      currentPortfolio: null,
      activeTab: 'library',
      filters: {},
      
      // File management
      addUploadedFile: (file) => set((state) => {
        const strategiesWithIds = file.strategies.map(strategy => ({
          ...strategy,
          id: `${strategy.dataId.symbol}_${strategy.dataId.period}_${Date.now()}_${Math.random()}`
        }));
        
        return {
          uploadedFiles: [...state.uploadedFiles, { ...file, strategies: strategiesWithIds }],
          allStrategies: [...state.allStrategies, ...strategiesWithIds]
        };
      }),
      
      removeUploadedFile: (fileName) => set((state) => {
        const fileToRemove = state.uploadedFiles.find(f => f.name === fileName);
        if (!fileToRemove) return state;
        
        const strategyIdsToRemove = fileToRemove.strategies.map(s => s.id!);
        
        return {
          uploadedFiles: state.uploadedFiles.filter(f => f.name !== fileName),
          allStrategies: state.allStrategies.filter(s => !strategyIdsToRemove.includes(s.id!)),
          selectedStrategies: state.selectedStrategies.filter(id => !strategyIdsToRemove.includes(id))
        };
      }),
      
      // Strategy selection
      setSelectedStrategies: (strategyIds) => set({ selectedStrategies: strategyIds }),
      
      addToSelection: (strategyId) => set((state) => ({
        selectedStrategies: [...state.selectedStrategies, strategyId]
      })),
      
      removeFromSelection: (strategyId) => set((state) => ({
        selectedStrategies: state.selectedStrategies.filter(id => id !== strategyId)
      })),
      
      clearSelection: () => set({ selectedStrategies: [] }),
      
      // Portfolio management
      createPortfolio: (name) => {
        const { selectedStrategies, allStrategies } = get();
        const selectedData = allStrategies.filter(s => selectedStrategies.includes(s.id!));
        
        const portfolio: Portfolio = {
          id: `portfolio_${Date.now()}`,
          name,
          members: selectedData,
          createdAt: new Date()
        };
        
        set((state) => ({
          portfolios: [...state.portfolios, portfolio],
          currentPortfolio: portfolio
        }));
      },
      
      savePortfolio: (portfolio) => set((state) => ({
        portfolios: state.portfolios.map(p => p.id === portfolio.id ? portfolio : p)
      })),
      
      deletePortfolio: (portfolioId) => set((state) => ({
        portfolios: state.portfolios.filter(p => p.id !== portfolioId),
        currentPortfolio: state.currentPortfolio?.id === portfolioId ? null : state.currentPortfolio
      })),
      
      setCurrentPortfolio: (portfolioId) => {
        const { portfolios } = get();
        const portfolio = portfolioId ? portfolios.find(p => p.id === portfolioId) : null;
        set({ currentPortfolio: portfolio || null });
      },
      
      // Filters
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),
      
      // UI
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      // Computed getters
      getFilteredStrategies: () => {
        const { allStrategies, filters } = get();
        
        return allStrategies.filter(strategy => {
          if (filters.symbol && strategy.dataId.symbol !== filters.symbol) return false;
          if (filters.period && strategy.dataId.period !== filters.period) return false;
          if (filters.minProfitFactor && strategy.backtestStats.profitFactor < filters.minProfitFactor) return false;
          if (filters.maxDrawdown && Math.abs(strategy.backtestStats.maxDrawdown) > filters.maxDrawdown) return false;
          if (filters.minSQN && strategy.backtestStats.sqn < filters.minSQN) return false;
          if (filters.minWinRate && strategy.backtestStats.winRate < filters.minWinRate) return false;
          
          return true;
        });
      },
      
      getSelectedStrategiesData: () => {
        const { allStrategies, selectedStrategies } = get();
        return allStrategies.filter(s => selectedStrategies.includes(s.id!));
      }
    }),
    {
      name: 'portfolio-store',
      partialize: (state) => ({
        uploadedFiles: state.uploadedFiles,
        allStrategies: state.allStrategies,
        portfolios: state.portfolios,
        filters: state.filters
      })
    }
  )
);