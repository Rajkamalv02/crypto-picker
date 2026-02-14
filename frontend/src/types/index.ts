export interface Strategy {
    id: string;
    name: string;
    description: string;
}

export interface Asset {
    symbol: string;
    fullName: string;
    price: number;
    high24h: number;
    low24h: number;
    volume24h: number;
    image: string;
}

export interface MarketDataResponse {
    assets: Asset[];
    total: number;
    page: number;
    limit: number;
}

export interface StrategyResult {
    signal: 'BUY' | 'SELL' | 'NEUTRAL';
    probability: number;
    reason: string;
    latestValue: string;
}

export interface ChargeBreakdown {
    investmentAmount: number;
    type: string;
    totalCharges: number;
    netAmount: number;
    brokerage: number;
    gst: number;
    tds?: number; // Crypto specific
    stt?: number; // Stock specific
    txnCharge?: number; // Stock specific
    sebi?: number; // Stock specific
    stampDuty?: number; // Stock specific
    details: Record<string, string>;
}

export interface AssetDetailResponse {
    asset: Asset & { changePct24h: number };
    strategy: StrategyResult;
    calculator: {
        buy: ChargeBreakdown;
        sell: ChargeBreakdown;
    };
}
