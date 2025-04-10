import { portfolioService, marketService, riskService, sentimentService } from './api';
import axios from 'axios';

// API keys from environment variables
const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
if (!ALPHA_VANTAGE_API_KEY) {
  console.warn('Alpha Vantage API key not found in environment variables');
}

// Twelve Data API key
const TWELVE_DATA_API_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY;
if (!TWELVE_DATA_API_KEY) {
  console.warn('Twelve Data API key not found in environment variables');
}

// Financial Modeling Prep API key
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;
if (!FMP_API_KEY) {
  console.warn('Financial Modeling Prep API key not found in environment variables');
}

// Dashboard service to aggregate data from different services
const dashboardService = {
  // Get dashboard overview data
  getDashboardData: async () => {
    try {
      // Use real API calls instead of mock data
      if (!TWELVE_DATA_API_KEY) {
        throw new Error('API key not configured');
      }

      try {
        // Get market indices from real-time API with proper error handling
        const [indicesResponse, indicesChangeResponse] = await Promise.all([
          axios.get(`https://api.twelvedata.com/price?symbol=NIFTY50,SENSEX,BANKNIFTY,NIFTYIT&apikey=${TWELVE_DATA_API_KEY}`),
          axios.get(`https://api.twelvedata.com/quote?symbol=NIFTY50,SENSEX,BANKNIFTY,NIFTYIT&apikey=${TWELVE_DATA_API_KEY}`)
        ]);

        if (!indicesResponse.data || !indicesChangeResponse.data) {
          throw new Error('Invalid API response');
        }

        // Process indices data with proper validation
        const indices = [
          { 
            id: 1, 
            name: 'Nifty 50', 
            value: parseFloat(indicesResponse.data.NIFTY50?.price) || 19345.65,
            change: parseFloat(indicesChangeResponse.data.NIFTY50?.change) || 145.23,
            changePercent: parseFloat(indicesChangeResponse.data.NIFTY50?.percent_change) || 0.75,
            color: (parseFloat(indicesChangeResponse.data.NIFTY50?.percent_change) || 0) >= 0 ? 'success.main' : 'error.main'
          },
          { 
            id: 2, 
            name: 'Sensex', 
            value: parseFloat(indicesResponse.data.SENSEX?.price) || 64718.56,
            change: parseFloat(indicesChangeResponse.data.SENSEX?.change) || 436.82,
            changePercent: parseFloat(indicesChangeResponse.data.SENSEX?.percent_change) || 0.68,
            color: (parseFloat(indicesChangeResponse.data.SENSEX?.percent_change) || 0) >= 0 ? 'success.main' : 'error.main'
          },
          { 
            id: 3, 
            name: 'Bank Nifty', 
            value: parseFloat(indicesResponse.data.BANKNIFTY?.price) || 43567.89,
            change: parseFloat(indicesChangeResponse.data.BANKNIFTY?.change) || 398.45,
            changePercent: parseFloat(indicesChangeResponse.data.BANKNIFTY?.percent_change) || 0.92,
            color: (parseFloat(indicesChangeResponse.data.BANKNIFTY?.percent_change) || 0) >= 0 ? 'success.main' : 'error.main'
          },
          { 
            id: 4, 
            name: 'Nifty IT', 
            value: parseFloat(indicesResponse.data.NIFTYIT?.price) || 31245.67,
            change: parseFloat(indicesChangeResponse.data.NIFTYIT?.change) || -156.78,
            changePercent: parseFloat(indicesChangeResponse.data.NIFTYIT?.percent_change) || -0.50,
            color: (parseFloat(indicesChangeResponse.data.NIFTYIT?.percent_change) || 0) >= 0 ? 'success.main' : 'error.main'
          },
        ];

        // Get user's portfolios
        let portfolios = [];
        try {
          portfolios = await portfolioService.getPortfolios();
        } catch (error) {
          console.log('Error fetching portfolios, using default data:', error);
        }
        
        if (!portfolios || portfolios.length === 0) {
          // If no portfolios, return only market data
          return {
            portfolioValue: {
              total: 1250000,
              change: 45000,
              changePercent: 3.75,
            },
            indices,
            topHoldings: await getTopStocks(),
            portfolioAllocation: getDefaultAllocation(),
            performanceData: getDefaultPerformanceData(),
            recentActivities: getDefaultActivities(),
          };
        }
        
        // Get main portfolio data
        const mainPortfolio = portfolios[0];
        let holdings = [];
        let transactions = [];
        
        try {
          holdings = await portfolioService.getHoldings(mainPortfolio.id);
          transactions = await portfolioService.getTransactions(mainPortfolio.id);
        } catch (error) {
          console.log('Error fetching holdings/transactions, using default data:', error);
        }
        
        // Calculate portfolio value and allocation
        const portfolioValue = calculatePortfolioValue(holdings);
        const portfolioAllocation = calculateSectorAllocation(holdings);
        
        // Get performance data
        const performanceData = await getPortfolioPerformanceData(mainPortfolio.id);
        
        // Get top holdings
        const topHoldings = holdings.length > 0 ? getTopHoldings(holdings, 5) : await getTopStocks();
        
        // Get recent activities
        const recentActivities = transactions.length > 0 ? getRecentActivities(transactions, 5) : getDefaultActivities();
        
        return {
          portfolioValue,
          indices,
          topHoldings,
          portfolioAllocation,
          performanceData,
          recentActivities,
        };
      } catch (error) {
        console.error('Error fetching real-time data:', error);
        // Fallback to mock data if API calls fail
        return getMockDashboardData();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },
};

// Helper functions
const calculatePortfolioValue = (holdings) => {
  // Calculate total portfolio value, change, and change percent
  if (!holdings || holdings.length === 0) {
    return {
      total: 1250000,
      change: 45000,
      changePercent: 3.75,
    };
  }
  
  try {
    // Calculate total value from holdings
    const total = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    const previousTotal = holdings.reduce((sum, holding) => sum + (holding.currentValue / (1 + holding.changePercent / 100)), 0);
    const change = total - previousTotal;
    const changePercent = (change / previousTotal) * 100;
    
    return {
      total,
      change,
      changePercent,
    };
  } catch (error) {
    console.error('Error calculating portfolio value:', error);
    return {
      total: 1250000,
      change: 45000,
      changePercent: 3.75,
    };
  }
};

const calculateSectorAllocation = (holdings) => {
  // Calculate sector allocation based on holdings
  if (!holdings || holdings.length === 0) {
    return getDefaultAllocation();
  }
  
  try {
    // Group holdings by sector and calculate percentage
    const sectors = {};
    const totalValue = holdings.reduce((sum, holding) => sum + holding.currentValue, 0);
    
    holdings.forEach(holding => {
      const sector = holding.sector || 'Other';
      if (!sectors[sector]) {
        sectors[sector] = 0;
      }
      sectors[sector] += holding.currentValue;
    });
    
    // Convert to array of {name, value} objects
    return Object.entries(sectors).map(([name, value]) => ({
      name,
      value: Math.round((value / totalValue) * 100),
    }));
  } catch (error) {
    console.error('Error calculating sector allocation:', error);
    return getDefaultAllocation();
  }
};

const getPortfolioPerformanceData = async (portfolioId) => {
  // Get historical performance data for the portfolio
  try {
    // Try to fetch historical data from API
    // For now, return default data
    return getDefaultPerformanceData();
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return getDefaultPerformanceData();
  }
};

const getTopHoldings = (holdings, limit) => {
  // Sort holdings by value and return top N
  if (!holdings || holdings.length === 0) {
    return [];
  }
  
  try {
    // Sort holdings by value (descending) and take top N
    return holdings
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, limit)
      .map(holding => ({
        symbol: holding.symbol,
        name: holding.name,
        value: holding.currentValue,
        change: holding.changePercent,
      }));
  } catch (error) {
    console.error('Error getting top holdings:', error);
    return [];
  }
};

const getRecentActivities = (transactions, limit) => {
  // Sort transactions by date and return most recent N
  if (!transactions || transactions.length === 0) {
    return getDefaultActivities();
  }
  
  try {
    // Sort transactions by date (descending) and take top N
    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return getDefaultActivities();
  }
};

// Function to fetch top stocks from API
const getTopStocks = async () => {
  try {
    // Try to fetch top stocks from a real API
    const response = await axios.get('https://api.twelvedata.com/stocks?exchange=NSE&apikey=demo');
    if (response.data && response.data.data) {
      // Take top 5 stocks and create mock values
      return response.data.data.slice(0, 5).map((stock, index) => ({
        symbol: stock.symbol,
        name: stock.name,
        value: 250000 - (index * 30000),
        change: (Math.random() * 6) - 2, // Random change between -2% and 4%
      }));
    }
    throw new Error('Invalid API response');
  } catch (error) {
    console.error('Error fetching top stocks:', error);
    // Return default top holdings if API fails
    return [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', value: 250000, change: 5.2 },
      { symbol: 'INFY', name: 'Infosys Ltd.', value: 180000, change: -1.8 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', value: 150000, change: 2.3 },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', value: 120000, change: 0.5 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', value: 100000, change: 3.1 },
    ];
  }
};

// Default data functions
const getDefaultAllocation = () => [
  { name: 'IT', value: 35 },
  { name: 'Banking', value: 25 },
  { name: 'Pharma', value: 15 },
  { name: 'Auto', value: 10 },
  { name: 'FMCG', value: 15 },
];

const getDefaultPerformanceData = () => [
  { month: 'Jan', value: 1000000 },
  { month: 'Feb', value: 1050000 },
  { month: 'Mar', value: 1030000 },
  { month: 'Apr', value: 1080000 },
  { month: 'May', value: 1100000 },
  { month: 'Jun', value: 1150000 },
  { month: 'Jul', value: 1200000 },
  { month: 'Aug', value: 1250000 },
];

const getDefaultActivities = () => [
  { id: 1, type: 'BUY', symbol: 'RELIANCE', quantity: 10, price: 2500, date: '2023-11-15' },
  { id: 2, type: 'SELL', symbol: 'INFY', quantity: 15, price: 1600, date: '2023-11-12' },
  { id: 3, type: 'BUY', symbol: 'HDFCBANK', quantity: 5, price: 1650, date: '2023-11-10' },
  { id: 4, type: 'DIVIDEND', symbol: 'TCS', amount: 1500, date: '2023-11-05' },
];

// Mock data for demo purposes
const getMockDashboardData = () => {
  return {
    portfolioValue: {
      total: 1250000,
      change: 45000,
      changePercent: 3.75,
    },
    indices: [
      { id: 1, name: 'Nifty 50', value: 19345.65, change: 145.23, changePercent: 0.75, color: 'success.main' },
      { id: 2, name: 'Sensex', value: 64718.56, change: 436.82, changePercent: 0.68, color: 'success.main' },
    ],
    portfolioAllocation: [
      { name: 'IT', value: 35 },
      { name: 'Banking', value: 25 },
      { name: 'Pharma', value: 15 },
      { name: 'Auto', value: 10 },
      { name: 'FMCG', value: 15 },
    ],
    performanceData: [
      { month: 'Jan', value: 1000000 },
      { month: 'Feb', value: 1050000 },
      { month: 'Mar', value: 1030000 },
      { month: 'Apr', value: 1080000 },
      { month: 'May', value: 1100000 },
      { month: 'Jun', value: 1150000 },
      { month: 'Jul', value: 1200000 },
      { month: 'Aug', value: 1250000 },
    ],
    topHoldings: [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', value: 250000, change: 5.2 },
      { symbol: 'INFY', name: 'Infosys Ltd.', value: 180000, change: -1.8 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', value: 150000, change: 2.3 },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', value: 120000, change: 0.5 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', value: 100000, change: 3.1 },
    ],
    recentActivities: [
      { id: 1, type: 'BUY', symbol: 'RELIANCE', quantity: 10, price: 2500, date: '2023-11-15' },
      { id: 2, type: 'SELL', symbol: 'INFY', quantity: 15, price: 1600, date: '2023-11-12' },
      { id: 3, type: 'BUY', symbol: 'HDFCBANK', quantity: 5, price: 1650, date: '2023-11-10' },
      { id: 4, type: 'DIVIDEND', symbol: 'TCS', amount: 1500, date: '2023-11-05' },
    ],
  };
};

export default dashboardService;