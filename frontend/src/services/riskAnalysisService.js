import axios from 'axios';

// API Configuration
const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo';
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || 'demo';

// Base URLs
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

class RiskAnalysisService {
  // Fetch historical data for Monte Carlo simulation
  async getHistoricalData(symbol, days = 252) {
    try {
      const response = await axios.get(`${ALPHA_VANTAGE_BASE_URL}`, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol,
          outputsize: 'full',
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });

      if (!response.data || !response.data['Time Series (Daily)']) {
        throw new Error('Invalid response format from Alpha Vantage API');
      }

      const timeSeriesData = response.data['Time Series (Daily)'];
      const dates = Object.keys(timeSeriesData).slice(0, days);
      
      return dates.map(date => ({
        date,
        price: parseFloat(timeSeriesData[date]['4. close'])
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  // Calculate daily returns from historical data
  calculateDailyReturns(historicalData) {
    const returns = [];
    for (let i = 1; i < historicalData.length; i++) {
      const dailyReturn = (historicalData[i-1].price - historicalData[i].price) / historicalData[i].price;
      returns.push(dailyReturn);
    }
    return returns;
  }

  // Monte Carlo Simulation
  async runMonteCarloSimulation(holdings, simulations = 1000, days = 252) {
    try {
      const portfolioValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
      const weights = holdings.map(holding => holding.value / portfolioValue);
      
      // Get historical data for all holdings
      const historicalDataPromises = holdings.map(holding => this.getHistoricalData(holding.symbol));
      const historicalDataArray = await Promise.all(historicalDataPromises);
      
      // Calculate daily returns for each holding
      const returnsArray = historicalDataArray.map(data => this.calculateDailyReturns(data));
      
      // Calculate portfolio parameters
      const means = returnsArray.map(returns => {
        const sum = returns.reduce((a, b) => a + b, 0);
        return sum / returns.length;
      });
      
      const covariance = this.calculateCovarianceMatrix(returnsArray);
      const portfolioMean = means.reduce((sum, mean, i) => sum + mean * weights[i], 0);
      const portfolioStd = Math.sqrt(this.calculatePortfolioVariance(weights, covariance));
      
      // Run simulations
      const simResults = [];
      for (let sim = 0; sim < simulations; sim++) {
        let simulatedValue = portfolioValue;
        for (let day = 0; day < days; day++) {
          const randomReturn = this.generateRandomReturn(portfolioMean, portfolioStd);
          simulatedValue *= (1 + randomReturn);
        }
        simResults.push(simulatedValue);
      }
      
      // Calculate VaR at different confidence levels
      const sortedResults = simResults.sort((a, b) => a - b);
      const var95 = portfolioValue - sortedResults[Math.floor(0.05 * simulations)];
      const var99 = portfolioValue - sortedResults[Math.floor(0.01 * simulations)];
      
      return {
        simulationResults: simResults,
        metrics: {
          meanReturn: portfolioMean * 252, // Annualized
          volatility: portfolioStd * Math.sqrt(252), // Annualized
          var95: var95,
          var99: var99,
          worstCase: portfolioValue - sortedResults[0],
          bestCase: sortedResults[simulations - 1] - portfolioValue
        }
      };
    } catch (error) {
      console.error('Error running Monte Carlo simulation:', error);
      throw error;
    }
  }

  // Calculate covariance matrix for portfolio holdings
  calculateCovarianceMatrix(returnsArray) {
    const n = returnsArray.length;
    const matrix = Array(n).fill().map(() => Array(n).fill(0));
    
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const cov = this.calculateCovariance(returnsArray[i], returnsArray[j]);
        matrix[i][j] = cov;
        matrix[j][i] = cov;
      }
    }
    
    return matrix;
  }

  // Calculate covariance between two return series
  calculateCovariance(returns1, returns2) {
    const mean1 = returns1.reduce((a, b) => a + b, 0) / returns1.length;
    const mean2 = returns2.reduce((a, b) => a + b, 0) / returns2.length;
    const n = Math.min(returns1.length, returns2.length);
    
    let covariance = 0;
    for (let i = 0; i < n; i++) {
      covariance += (returns1[i] - mean1) * (returns2[i] - mean2);
    }
    
    return covariance / (n - 1);
  }

  // Calculate portfolio variance using weights and covariance matrix
  calculatePortfolioVariance(weights, covarianceMatrix) {
    let variance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        variance += weights[i] * weights[j] * covarianceMatrix[i][j];
      }
    }
    return variance;
  }

  // Generate random return using normal distribution
  generateRandomReturn(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + std * z;
  }

  // Calculate portfolio risk metrics
  async calculateRiskMetrics(holdings) {
    try {
      const monteCarloResults = await this.runMonteCarloSimulation(holdings);
      const portfolioValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
      
      // Get market data for beta calculation
      const marketData = await this.getHistoricalData('SPY'); // Using S&P 500 as market proxy
      const marketReturns = this.calculateDailyReturns(marketData);
      
      // Calculate portfolio returns
      const portfolioReturns = monteCarloResults.simulationResults.map(value => 
        (value - portfolioValue) / portfolioValue
      );
      
      // Calculate beta
      const beta = this.calculateBeta(portfolioReturns, marketReturns);
      
      // Calculate Sharpe Ratio (assuming 2% risk-free rate)
      const riskFreeRate = 0.02;
      const sharpeRatio = (monteCarloResults.metrics.meanReturn - riskFreeRate) / 
                         monteCarloResults.metrics.volatility;
      
      return {
        ...monteCarloResults.metrics,
        beta,
        sharpeRatio,
        diversificationScore: this.calculateDiversificationScore(holdings)
      };
    } catch (error) {
      console.error('Error calculating risk metrics:', error);
      throw error;
    }
  }

  // Calculate portfolio beta
  calculateBeta(portfolioReturns, marketReturns) {
    const covariance = this.calculateCovariance(portfolioReturns, marketReturns);
    const marketVariance = this.calculateCovariance(marketReturns, marketReturns);
    return covariance / marketVariance;
  }

  // Calculate diversification score
  calculateDiversificationScore(holdings) {
    const sectors = new Set(holdings.map(holding => holding.sector));
    const sectorCount = sectors.size;
    const holdingCount = holdings.length;
    
    // Calculate Herfindahl-Hirschman Index (HHI)
    const weights = holdings.map(holding => holding.value);
    const totalValue = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / totalValue);
    const hhi = normalizedWeights.reduce((sum, weight) => sum + weight * weight, 0);
    
    // Combine sector and holding concentration
    const sectorScore = sectorCount / Math.max(holdingCount, 10); // Max sectors assumed 10
    const concentrationScore = 1 - hhi; // Lower HHI is better
    
    return (sectorScore + concentrationScore) * 50; // Scale to 0-100
  }
}

export const riskAnalysisService = new RiskAnalysisService();