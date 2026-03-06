import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode
} from 'react';

const API_BASE = 'http://localhost:5001';
const POLL_INTERVAL = 30_000;

export interface MarketData {
  symbol: string;
  yfsymbol?: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number | null;
  pe?: number | null;
  name?: string;
  sector?: string;
}

export interface IndexData {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  open?: number;
  prevClose?: number;
}

export interface MarketBreadth {
  advances: number;
  declines: number;
  unchanged: number;
  ratio: number;
}

interface DataContextType {
  indices: IndexData[];
  topGainers: MarketData[];
  topLosers: MarketData[];
  topStocks: MarketData[];
  marketBreadth: MarketBreadth | null;
  isMarketOpen: boolean;
  lastUpdated: Date;
  loading: boolean;
  error: string | null;
  refreshData: () => void;
  apiBase: string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

const isNSEOpen = (): boolean => {
  const now = new Date();
  const day = now.getDay();
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;
  return day >= 1 && day <= 5 && mins >= 9 * 60 + 15 && mins < 15 * 60 + 30;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [topGainers, setTopGainers] = useState<MarketData[]>([]);
  const [topLosers, setTopLosers] = useState<MarketData[]>([]);
  const [topStocks, setTopStocks] = useState<MarketData[]>([]);
  const [marketBreadth, setMarketBreadth] = useState<MarketBreadth | null>(null);
  const [isMarketOpen, setIsMarketOpen] = useState(isNSEOpen());
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/market`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setIndices(data.indices ?? []);
      setTopGainers(data.topGainers ?? []);
      setTopLosers(data.topLosers ?? []);
      setTopStocks(data.topStocks ?? []);
      setMarketBreadth(data.marketBreadth ?? null);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    refreshData();
    const id = setInterval(refreshData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [refreshData]);

  // Market open/close check
  useEffect(() => {
    setIsMarketOpen(isNSEOpen());
    const id = setInterval(() => setIsMarketOpen(isNSEOpen()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <DataContext.Provider value={{
      indices, topGainers, topLosers, topStocks, marketBreadth,
      isMarketOpen, lastUpdated, loading, error, refreshData,
      apiBase: API_BASE,
    }}>
      {children}
    </DataContext.Provider>
  );
};
