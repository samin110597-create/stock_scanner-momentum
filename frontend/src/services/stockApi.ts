import type { OHLCV } from '../utils/calculations';
import { stockCache } from './database';

export type DataSource = 'yahoo' | 'cache' | 'unavailable';
export let lastDataSource: DataSource = 'unavailable';
export const isDemoMode = false;

export interface StockUniverse {
  id: string;
  name: string;
  symbols: string[];
  isCustom?: boolean;
}

async function fetchFromYahoo(symbol: string, range: string = '1y'): Promise<OHLCV[] | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`[Yahoo] HTTP ${response.status} for ${symbol}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      console.warn(`[Yahoo] No data for ${symbol}`);
      return null;
    }
    
    const result = data.chart.result[0];
    const timestamps: number[] = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] as { open: (number | null)[]; high: (number | null)[]; low: (number | null)[]; close: (number | null)[]; volume: (number | null)[] } | undefined;
    
    if (!quote || !timestamps.length) return null;
    
    const ohlcv: OHLCV[] = [];
    
    for (let j = 0; j < timestamps.length; j++) {
      const date = new Date(timestamps[j] * 1000);
      const open = quote.open?.[j];
      const high = quote.high?.[j];
      const low = quote.low?.[j];
      const close = quote.close?.[j];
      const volume = quote.volume?.[j];
      
      if (open == null || high == null || low == null || close == null) continue;
      
      ohlcv.push({
        date: date.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume: volume ?? 0,
      });
    }
    
    if (ohlcv.length >= 50) {
      console.log(`[Yahoo] Got ${ohlcv.length} bars for ${symbol}`);
      lastDataSource = 'yahoo';
      return ohlcv;
    }
    
  } catch (error) {
    console.warn(`[Yahoo] Error for ${symbol}:`, error);
  }
  
  return null;
}

export const STOCK_UNIVERSES: StockUniverse[] = [
  { id: 'sp500', name: 'S&P 500', symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH', 'XOM', 'JPM', 'V', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV', 'LLY', 'PEP', 'AVGO', 'ORCL', 'ADBE', 'CRM', 'CSCO', 'ACN', 'MCD', 'WMT', 'NFLX', 'KO', 'COST', 'AMD', 'QCOM', 'TXN', 'HON', 'UBER', 'AMAT', 'LOW', 'INTC', 'SBUX', 'GE', 'CAT', 'GILD', 'ISRG', 'BKNG', 'MDLZ', 'ADP', 'REGN', 'LRCX', 'VRTX', 'ZTS'] },
  { id: 'nasdaq100', name: 'NASDAQ 100', symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'GOOG', 'AVGO', 'ADBE', 'CRM', 'CSCO', 'NFLX', 'AMD', 'QCOM', 'TXN', 'PEP', 'COST', 'MCD', 'ACN', 'ABBV', 'CMCSA', 'WMT', 'NKE', 'INTC', 'HON', 'INTU', 'TXN', 'AMAT', 'LRCX', 'BKNG', 'SBUX', 'MDLZ', 'ADP', 'REGN', 'VRTX', 'ISRG', 'GILD', 'KLAC', 'SNPS', 'CDNS', 'ORLY', 'NXPI', 'MRNA', 'PANW', 'CRWD', 'ZS', 'DDOG', 'NET', 'OKTA', 'SNOW'] },
  { id: 'tech-giants', name: 'Tech Giants', symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'AMD', 'QCOM', 'TXN', 'INTC', 'CSCO', 'ORCL', 'ADBE', 'IBM', 'CRM', 'PYPL', 'SHOP', 'SQ', 'UBER'] },
  { id: 'high-momentum', name: 'High Momentum', symbols: ['NVDA', 'TSLA', 'AMD', 'AVGO', 'META', 'PLTR', 'SMCI', 'ARM', 'COIN', 'RIVN', 'LCID', 'SOFI', 'PATH', 'U', 'BBAI', 'AI', 'DDOG', 'SNOW', 'CRWD', 'NET'] },
  { id: 'semiconductors', name: 'Semiconductors', symbols: ['NVDA', 'AMD', 'INTC', 'AVGO', 'QCOM', 'TXN', 'MU', 'AMAT', 'LRCX', 'KLAC', 'SNPS', 'CDNS', 'MRVL', 'ON', 'ARM', 'NXPI', 'ADI', 'MCHP', 'TER', 'ASML'] },
  { id: 'clean-energy', name: 'Clean Energy', symbols: ['ENPH', 'SEDG', 'FSLR', 'RUN', 'NEE', 'IBDRY', 'BE', 'PLUG', 'FCEL', 'BLNK', 'SBE', 'CHPT', 'FLSW', 'EVGO', 'RSASF', 'BEPC', 'CWEN', 'ORA'] },
  { id: 'fintech', name: 'FinTech', symbols: ['COIN', 'SQ', 'PYPL', 'SHOP', 'AFRM', 'SOFI', 'UPST', 'HOOD', 'V', 'MA', 'AX', 'FI', 'GPN', 'WORLD', 'NU', 'RBLX', 'U', 'PATH'] },
  { id: 'biotech', name: 'Biotech', symbols: ['MRNA', 'REGN', 'BIIB', 'GILD', 'NVAX', 'BNTX', 'INO', 'OCGN', 'ABBV', 'BMY', 'LLY', 'PFE', 'JNJ', 'UNH', 'ISRG', 'DXCM', 'TMO', 'DHR', 'ABT', 'AMGN'] },
  { id: 'full-universe', name: 'Full Universe (80 stocks)', symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'ADBE', 'CRM', 'CSCO', 'NFLX', 'AMD', 'QCOM', 'TXN', 'PEP', 'COST', 'MCD', 'ACN', 'ABBV', 'CMCSA', 'WMT', 'NKE', 'INTC', 'HON', 'INTU', 'AMAT', 'LRCX', 'BKNG', 'SBUX', 'MDLZ', 'ADP', 'REGN', 'VRTX', 'ISRG', 'GILD', 'KLAC', 'SNPS', 'ORLY', 'NXPI', 'MRNA', 'PANW', 'CRWD', 'ZS', 'DDOG', 'NET', 'OKTA', 'SNOW', 'PLTR', 'SMCI', 'COIN', 'RIVN', 'SOFI', 'PATH', 'U', 'BBAI', 'ENPH', 'FSLR', 'RUN', 'SQ', 'PYPL', 'HOOD', 'MRVL', 'ARM', 'DHR', 'TMO', 'ABT'] },
];

export async function fetchHistoricalData(
  symbol: string,
  _interval?: string,
  forceRefresh: boolean = false
): Promise<OHLCV[] | null> {
  try {
    if (!forceRefresh) {
      const cached = await stockCache.getCachedData(symbol);
      if (cached && validateOHLCV(cached.data as OHLCV[])) {
        console.log(`[Cache] Hit for ${symbol}`);
        lastDataSource = 'cache';
        return cached.data as OHLCV[];
      }
    }

    console.log(`[Fetch] Fetching ${symbol} from Yahoo Finance...`);
    const data = await fetchFromYahoo(symbol);

    if (!data || !validateOHLCV(data)) {
      console.warn(`[Fetch] Real market data unavailable for ${symbol}; no synthetic fallback will be generated.`);
      lastDataSource = 'unavailable';
      return null;
    }

    await stockCache.setCachedData(symbol, data);
    console.log(`[Fetch] Got ${data.length} real bars for ${symbol}`);
    lastDataSource = 'yahoo';
    return data;
  } catch (error) {
    console.error(`[Fetch] Real market data error for ${symbol}:`, error);
    lastDataSource = 'unavailable';
    return null;
  }
}

export async function fetchBatchHistoricalData(
  symbols: string[],
  onProgress?: (current: number, total: number, symbol: string) => void
): Promise<Map<string, OHLCV[]>> {
  const results = new Map<string, OHLCV[]>();

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    onProgress?.(i + 1, symbols.length, symbol);
    const data = await fetchHistoricalData(symbol);
    if (data) results.set(symbol, data);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return results;
}

export function validateOHLCV(data: OHLCV[]): boolean {
  if (!data || data.length < 50) return false;
  
  for (const bar of data) {
    if (!bar.date || isNaN(bar.open) || isNaN(bar.high) || 
        isNaN(bar.low) || isNaN(bar.close) || isNaN(bar.volume)) {
      return false;
    }
    if (bar.high < bar.low || bar.close < 0 || bar.volume < 0) {
      return false;
    }
  }
  
  return true;
}

export function getDataStats(data: OHLCV[]): {
  minDate: string;
  maxDate: string;
  totalDays: number;
  avgVolume: number;
} {
  if (!data.length) {
    return { minDate: '', maxDate: '', totalDays: 0, avgVolume: 0 };
  }
  
  const volumes = data.map(d => d.volume);
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  
  return {
    minDate: data[0].date,
    maxDate: data[data.length - 1].date,
    totalDays: data.length,
    avgVolume,
  };
}

export async function getAllUniverses(): Promise<StockUniverse[]> {
  const saved = await stockCache.getSavedUniverses();
  const customUniverses: StockUniverse[] = saved.map(u => ({
    id: u.id,
    name: u.name,
    symbols: u.symbols,
    isCustom: true,
  }));
  return [...STOCK_UNIVERSES, ...customUniverses];
}