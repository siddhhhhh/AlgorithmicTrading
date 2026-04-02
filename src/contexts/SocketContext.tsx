import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WSIndexData {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
}

export interface WSMoverData {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface LatencyMetrics {
  nse_fetch_ms: number;
  indices_ms: number;
  movers_ms: number;
  total_ms: number;
  broadcast_ts: number;
}

export interface MarketSession {
  status: 'closed' | 'pre_market' | 'open' | 'post_market';
  label: string;
  color: string;
  next: string;
}

export interface WSMarketData {
  indices: WSIndexData[];
  vix: number;
  vix_change: number;
  topGainers: WSMoverData[];
  topLosers: WSMoverData[];
  timestamp: string;
  latency: LatencyMetrics;
  marketSession: MarketSession;
}

export interface OptionSide {
  ltp: number;
  change: number;
  pChange: number;
  oi: number;
  oiChange: number;
  volume: number;
  iv: number;
  bidQty: number;
  bidPrice: number;
  askPrice: number;
  askQty: number;
}

export interface OptionsStrikeData {
  strike: number;
  expiry: string;
  moneyness: 'ITM' | 'ATM' | 'OTM';
  CE: OptionSide;
  PE: OptionSide;
}

export interface OptionsSummary {
  totalCeOI: number;
  totalPeOI: number;
  totalCeVolume: number;
  totalPeVolume: number;
  pcr: number;
  pcrSentiment: string;
  maxCallOI: { strike: number; oi: number };
  maxPutOI: { strike: number; oi: number };
  maxPain: number;
  expectedMove: number;
}

export interface WSOptionsData {
  symbol: string;
  underlyingValue: number;
  expiries: string[];
  selectedExpiry: string;
  data: OptionsStrikeData[];
  summary: OptionsSummary;
  timestamp: string;
  cachedAt: string | null;
  latency: { fetch_ms: number; process_ms: number; total_ms: number };
}

export interface AlertData {
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  id?: string;
}

interface SocketContextType {
  marketData: WSMarketData | null;
  optionsData: WSOptionsData | null;
  alerts: AlertData[];
  isConnected: boolean;
  connectionLatency: number;
  latencyHistory: number[];
  lastUpdateAge: number;
  changeSymbol: (symbol: string) => void;
  clearAlerts: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [marketData, setMarketData] = useState<WSMarketData | null>(null);
  const [optionsData, setOptionsData] = useState<WSOptionsData | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionLatency, setConnectionLatency] = useState(0);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [lastUpdateAge, setLastUpdateAge] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const pingTimestampRef = useRef<number>(0);
  const lastUpdateTsRef = useRef<number>(Date.now());
  const alertIdCounter = useRef(0);

  // Track last update age with high-frequency timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateAge(Date.now() - lastUpdateTsRef.current);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socketUrl = `http://${window.location.hostname}:5001`;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('🟢 WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔴 WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠ WebSocket connection error:', err.message);
    });

    // Market data updates (every ~2s)
    socket.on('market_update', (data: WSMarketData) => {
      setMarketData(data);
      lastUpdateTsRef.current = Date.now();
    });

    // Options chain updates (every ~5s)
    socket.on('options_update', (data: WSOptionsData) => {
      setOptionsData(data);
    });

    // Alerts
    socket.on('alert', (alert: AlertData) => {
      alertIdCounter.current += 1;
      const enrichedAlert = { ...alert, id: `alert-${alertIdCounter.current}-${Date.now()}` };
      setAlerts(prev => [enrichedAlert, ...prev].slice(0, 100)); // Keep last 100
    });

    // Latency measurement
    socket.on('pong_latency', () => {
      const rtt = Date.now() - pingTimestampRef.current;
      setConnectionLatency(rtt);
      setLatencyHistory(prev => [...prev.slice(-19), rtt]); // Last 20
    });

    // Ping every 5 seconds for RTT measurement
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        pingTimestampRef.current = Date.now();
        socket.emit('ping_latency');
      }
    }, 5000);

    socketRef.current = socket;

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };
  }, []);

  const changeSymbol = useCallback((symbol: string) => {
    socketRef.current?.emit('change_symbol', { symbol });
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return (
    <SocketContext.Provider value={{
      marketData,
      optionsData,
      alerts,
      isConnected,
      connectionLatency,
      latencyHistory,
      lastUpdateAge,
      changeSymbol,
      clearAlerts,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
