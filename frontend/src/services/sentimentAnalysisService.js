import axios from 'axios';

// API Configuration
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || 'demo';
const FINBERT_API_URL = import.meta.env.VITE_FINBERT_API_URL || 'http://localhost:8000/api/sentiment';

// Base URL for News API
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

class SentimentAnalysisService {
  // Fetch financial news for a company or market
  async getFinancialNews(query, days = 7) {
    try {
      if (!NEWS_API_KEY || NEWS_API_KEY === 'demo') {
        throw new Error('Valid News API key is required');
      }

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
        params: {
          q: query,
          language: 'en',
          from: fromDate.toISOString(),
          sortBy: 'publishedAt',
          apiKey: NEWS_API_KEY
        }
      });

      if (!response.data || !Array.isArray(response.data.articles)) {
        throw new Error('Invalid response format from News API');
      }

      return response.data.articles;
    } catch (error) {
      console.error('Error fetching financial news:', error);
      if (error.response?.status === 404) {
        throw new Error('News API endpoint not found. Please check your API configuration.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid News API key. Please check your API key configuration.');
      } else if (error.response?.status === 429) {
        throw new Error('News API rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  }

  // Analyze sentiment using FinBERT
  async analyzeSentiment(text) {
    try {
      const response = await axios.post(FINBERT_API_URL, {
        text: text
      });

      if (!response.data || !response.data.sentiment || !response.data.score) {
        throw new Error('Invalid response format from FinBERT API');
      }

      return {
        sentiment: response.data.sentiment, // positive, negative, or neutral
        score: response.data.score, // sentiment score between -1 and 1
        confidence: response.data.confidence // confidence score between 0 and 1
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Fallback to basic sentiment analysis if FinBERT API is not available
      return this.basicSentimentAnalysis(text);
    }
  }

  // Basic sentiment analysis as fallback
  basicSentimentAnalysis(text) {
    const positiveWords = new Set([
      'bullish', 'growth', 'profit', 'gain', 'positive', 'up', 'rise', 'increase',
      'outperform', 'beat', 'strong', 'success', 'improve', 'advantage', 'opportunity'
    ]);

    const negativeWords = new Set([
      'bearish', 'loss', 'decline', 'negative', 'down', 'fall', 'decrease',
      'underperform', 'miss', 'weak', 'fail', 'risk', 'threat', 'concern'
    ]);

    const words = text.toLowerCase().split(/\W+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.has(word)) positiveCount++;
      if (negativeWords.has(word)) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return { sentiment: 'neutral', score: 0, confidence: 0.5 };

    const score = (positiveCount - negativeCount) / total;
    return {
      sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
      score: score,
      confidence: Math.abs(score)
    };
  }

  // Analyze company sentiment
  async analyzeCompanySentiment(symbol, companyName) {
    try {
      // Fetch news articles
      const news = await this.getFinancialNews(`${symbol} OR "${companyName}"`);
      
      // Analyze sentiment for each article
      const sentimentPromises = news.map(article =>
        this.analyzeSentiment(article.title + ' ' + (article.description || ''))
      );
      
      const sentiments = await Promise.all(sentimentPromises);
      
      // Calculate aggregate sentiment metrics
      const sentimentCounts = {
        positive: 0,
        neutral: 0,
        negative: 0
      };
      
      let totalScore = 0;
      let weightedScore = 0;
      let totalConfidence = 0;
      
      sentiments.forEach((sentiment, index) => {
        sentimentCounts[sentiment.sentiment]++;
        totalScore += sentiment.score;
        weightedScore += sentiment.score * sentiment.confidence;
        totalConfidence += sentiment.confidence;
      });
      
      const averageScore = totalScore / sentiments.length;
      const weightedAverageScore = weightedScore / totalConfidence;
      
      return {
        overallSentiment: weightedAverageScore > 0.1 ? 'positive' : weightedAverageScore < -0.1 ? 'negative' : 'neutral',
        sentimentScore: weightedAverageScore,
        confidence: totalConfidence / sentiments.length,
        distribution: {
          positive: sentimentCounts.positive / sentiments.length,
          neutral: sentimentCounts.neutral / sentiments.length,
          negative: sentimentCounts.negative / sentiments.length
        },
        articles: news.map((article, index) => ({
          ...article,
          sentiment: sentiments[index]
        })).slice(0, 10) // Return top 10 articles with sentiment
      };
    } catch (error) {
      console.error('Error analyzing company sentiment:', error);
      throw error;
    }
  }

  // Analyze market sentiment
  async analyzeMarketSentiment() {
    try {
      // Fetch market-related news
      const marketNews = await this.getFinancialNews('stock market OR financial markets OR trading');
      
      // Analyze sentiment for market news
      const sentimentPromises = marketNews.map(article =>
        this.analyzeSentiment(article.title + ' ' + (article.description || ''))
      );
      
      const sentiments = await Promise.all(sentimentPromises);
      
      // Calculate market sentiment metrics
      let bullishCount = 0;
      let bearishCount = 0;
      let neutralCount = 0;
      let totalScore = 0;
      
      sentiments.forEach(sentiment => {
        if (sentiment.score > 0.1) bullishCount++;
        else if (sentiment.score < -0.1) bearishCount++;
        else neutralCount++;
        totalScore += sentiment.score;
      });
      
      const totalArticles = sentiments.length;
      const marketSentimentScore = totalScore / totalArticles;
      
      return {
        marketSentiment: marketSentimentScore > 0.1 ? 'bullish' : marketSentimentScore < -0.1 ? 'bearish' : 'neutral',
        sentimentScore: marketSentimentScore,
        distribution: {
          bullish: bullishCount / totalArticles,
          neutral: neutralCount / totalArticles,
          bearish: bearishCount / totalArticles
        },
        articles: marketNews.map((article, index) => ({
          ...article,
          sentiment: sentiments[index]
        })).slice(0, 10) // Return top 10 articles with sentiment
      };
    } catch (error) {
      console.error('Error analyzing market sentiment:', error);
      throw error;
    }
  }

  // Get sentiment trends
  async getSentimentTrends(symbol, days = 30) {
    try {
      const news = await this.getFinancialNews(symbol, days);
      const dailySentiments = {};
      
      // Group articles by date and analyze sentiment
      for (const article of news) {
        const date = article.publishedAt.split('T')[0];
        if (!dailySentiments[date]) {
          dailySentiments[date] = [];
        }
        
        const sentiment = await this.analyzeSentiment(article.title + ' ' + (article.description || ''));
        dailySentiments[date].push(sentiment);
      }
      
      // Calculate daily average sentiment
      const trends = Object.entries(dailySentiments).map(([date, sentiments]) => {
        const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
        return {
          date,
          sentiment: avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral',
          score: avgScore,
          volume: sentiments.length
        };
      });
      
      return trends.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      console.error('Error getting sentiment trends:', error);
      throw error;
    }
  }
}

export const sentimentAnalysisService = new SentimentAnalysisService();