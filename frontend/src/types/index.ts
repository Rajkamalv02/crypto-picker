export interface Strategy {
    id: string;
    name: string;
    description: string;
}

export interface Asset {
    id?: string;
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
    brokerage: number;
    gst: number;
    tds: number;
    totalCharges: number;
    netAmount: number;
    details: {
        brokerageRate: string;
        gstRate: string;
        tdsRate: string;
    };
}

export interface AssetDetailResponse {
    asset: Asset & { changePct24h: number };
    strategy: StrategyResult;
    calculator: {
        buy: ChargeBreakdown;
        sell: ChargeBreakdown;
    };
}
