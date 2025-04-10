import axios from 'axios';

// API Configuration
const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo';
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || 'demo';
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || 'demo';

// Base URLs
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Market Data Service
class MarketDataService {
  // Stock Price Data
  async getStockPrice(symbol) {
    if (!ALPHA_VANTAGE_API_KEY || ALPHA_VANTAGE_API_KEY === 'demo') {
      throw new Error('Valid Alpha Vantage API key is required');
    }
    try {
      const response = await axios.get(`${ALPHA_VANTAGE_BASE_URL}`, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol,
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });
      
      if (!response.data || !response.data['Global Quote']) {
        throw new Error('Invalid response format from Alpha Vantage API');
      }
      
      return response.data['Global Quote'];
    } catch (error) {
      console.error('Error fetching stock price:', error);
      if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }

  // Historical Data
  async getHistoricalData(symbol, interval = 'daily') {
    try {
      const response = await axios.get(`${ALPHA_VANTAGE_BASE_URL}`, {
        params: {
          function: `TIME_SERIES_${interval.toUpperCase()}`,
          symbol,
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  // Company News
  async getCompanyNews(symbol) {
    if (!NEWS_API_KEY || NEWS_API_KEY === 'demo') {
      throw new Error('Valid News API key is required');
    }
    try {
      const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
        params: {
          q: symbol,
          language: 'en',
          sortBy: 'publishedAt',
          apiKey: NEWS_API_KEY
        }
      });
      
      if (!response.data || !Array.isArray(response.data.articles)) {
        throw new Error('Invalid response format from News API');
      }
      
      return response.data.articles;
    } catch (error) {
      console.error('Error fetching company news:', error);
      if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }

  // Company Profile
  async getCompanyProfile(symbol) {
    if (!FMP_API_KEY || FMP_API_KEY === 'demo') {
      throw new Error('Valid Financial Modeling Prep API key is required');
    }
    try {
      const response = await axios.get(`${FMP_BASE_URL}/profile/${symbol}`, {
        params: {
          apikey: FMP_API_KEY
        }
      });
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('Invalid response format from FMP API');
      }
      
      return response.data[0];
    } catch (error) {
      console.error('Error fetching company profile:', error);
      if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }

  // Financial Ratios
  async getFinancialRatios(symbol) {
    try {
      const response = await axios.get(`${FMP_BASE_URL}/ratios/${symbol}`, {
        params: {
          apikey: FMP_API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching financial ratios:', error);
      throw error;
    }
  }

  // Risk Metrics
  async getRiskMetrics(symbol) {
    try {
      const response = await axios.get(`${FMP_BASE_URL}/key-metrics/${symbol}`, {
        params: {
          apikey: FMP_API_KEY
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching risk metrics:', error);
      throw error;
    }
  }

  // Sentiment Analysis
  async getSentimentAnalysis(symbol) {
    try {
      // Get recent news articles
      const news = await this.getCompanyNews(symbol);
      
      // Calculate sentiment score based on news headlines
      // This is a simplified version. In a real app, you'd use a proper NLP service
      const sentimentScore = news.reduce((score, article) => {
        const headline = article.title.toLowerCase();
        if (headline.includes('positive') || headline.includes('surge') || headline.includes('gain')) {
          return score + 1;
        } else if (headline.includes('negative') || headline.includes('fall') || headline.includes('drop')) {
          return score - 1;
        }
        return score;
      }, 0);

      return {
        score: sentimentScore / news.length,
        articles: news.slice(0, 5) // Return top 5 articles
      };
    } catch (error) {
      console.error('Error calculating sentiment:', error);
      throw error;
    }
  }

  // Portfolio Risk Analysis
  async getPortfolioRiskAnalysis(holdings) {
    try {
      const riskAnalysis = {
        volatility: 0,
        beta: 0,
        sharpeRatio: 0,
        diversificationScore: 0
      };

      // Calculate portfolio metrics
      for (const holding of holdings) {
        const metrics = await this.getRiskMetrics(holding.symbol);
        const weight = holding.value / holdings.reduce((sum, h) => sum + h.value, 0);
        
        riskAnalysis.volatility += (metrics[0]?.volatility || 0) * weight;
        riskAnalysis.beta += (metrics[0]?.beta || 0) * weight;
      }

      // Calculate diversification score
      const sectors = new Set(holdings.map(h => h.sector));
      riskAnalysis.diversificationScore = (sectors.size / holdings.length) * 10;

      // Calculate Sharpe ratio (simplified)
      const riskFreeRate = 0.05; // 5% assumed risk-free rate
      const portfolioReturn = holdings.reduce((sum, h) => sum + h.changePercent, 0) / holdings.length;
      riskAnalysis.sharpeRatio = (portfolioReturn - riskFreeRate) / riskAnalysis.volatility;

      return riskAnalysis;
    } catch (error) {
      console.error('Error calculating portfolio risk:', error);
      throw error;
    }
  }
}

export const marketDataService = new MarketDataService();