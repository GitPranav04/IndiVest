import axios from 'axios';

// Create axios instance with base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const authService = {
  login: async (username, password) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      const response = await api.post('/token', formData);
      console.log('Login response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Login error:', error); // Debug log
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);
      console.log('Registration response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error); // Debug log
      // Properly format and throw the error with details
      if (error.response?.data) {
        throw new Error(error.response.data.detail || JSON.stringify(error.response.data));
      }
      throw new Error('Network error or server is not responding');
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Portfolio services
export const portfolioService = {
  getPortfolios: async () => {
    try {
      const response = await api.get('/portfolio');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getPortfolio: async (id) => {
    try {
      const response = await api.get(`/portfolio/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  createPortfolio: async (portfolioData) => {
    try {
      const response = await api.post('/portfolio', portfolioData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  updatePortfolio: async (id, portfolioData) => {
    try {
      const response = await api.put(`/portfolio/${id}`, portfolioData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  deletePortfolio: async (id) => {
    try {
      await api.delete(`/portfolio/${id}`);
      return true;
    } catch (error) {
      throw error;
    }
  },
  
  // Holdings
  getHoldings: async (portfolioId) => {
    try {
      const response = await api.get(`/portfolio/${portfolioId}/holdings`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  addHolding: async (portfolioId, holdingData) => {
    try {
      const response = await api.post(`/portfolio/${portfolioId}/holdings`, holdingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Transactions
  getTransactions: async (portfolioId) => {
    try {
      const response = await api.get(`/portfolio/${portfolioId}/transactions`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  addTransaction: async (portfolioId, transactionData) => {
    try {
      const response = await api.post(`/portfolio/${portfolioId}/transactions`, transactionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Market data services
export const marketService = {
  getStocks: async (search, sector) => {
    try {
      const params = {};
      if (search) params.search = search;
      if (sector) params.sector = sector;
      
      const response = await api.get('/market/stocks', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getStockBySymbol: async (symbol) => {
    try {
      const response = await api.get(`/market/stocks/symbol/${symbol}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getIndices: async () => {
    try {
      const response = await api.get('/market/indices');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getHistoricalData: async (symbol, period = '1y', interval = '1d') => {
    try {
      const response = await api.get(`/market/historical/${symbol}`, {
        params: { period, interval }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getTopGainers: async () => {
    try {
      const response = await api.get('/market/top-gainers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getTopLosers: async () => {
    try {
      const response = await api.get('/market/top-losers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Risk analysis services
export const riskService = {
  analyzePortfolioRisk: async (portfolioId, timeframe = '1y') => {
    try {
      const response = await api.post(`/risk/analyze/${portfolioId}`, {
        timeframe
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getStockRisk: async (symbol) => {
    try {
      const response = await api.get(`/risk/stock/${symbol}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getValueAtRisk: async (portfolioId, confidenceLevel = 95) => {
    try {
      const response = await api.get(`/risk/var/${portfolioId}`, {
        params: { confidence_level: confidenceLevel }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Sentiment analysis services
export const sentimentService = {
  analyzeText: async (text, stockId = null, useAdvancedModel = false) => {
    try {
      const params = { text, use_advanced_model: useAdvancedModel };
      if (stockId) params.stock_id = stockId;
      
      const response = await api.post('/sentiment/analyze', null, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getStockSentiment: async (symbol, timeframe = '1m') => {
    try {
      const response = await api.get(`/sentiment/stock/${symbol}`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getPortfolioSentiment: async (portfolioId) => {
    try {
      const response = await api.get(`/sentiment/portfolio/${portfolioId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getNewsSentiment: async (symbol = null, limit = 10) => {
    try {
      const params = { limit };
      if (symbol) params.symbol = symbol;
      
      const response = await api.get('/sentiment/news', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getSocialMediaSentiment: async (symbol = null, limit = 10) => {
    try {
      const params = { limit };
      if (symbol) params.symbol = symbol;
      
      const response = await api.get('/sentiment/social', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default {
  authService,
  portfolioService,
  marketService,
  riskService,
  sentimentService,
};