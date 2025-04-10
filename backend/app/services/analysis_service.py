from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import yfinance as yf
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
from sklearn.covariance import LedoitWolf

class AnalysisService:
    def __init__(self):
        # Initialize FinBERT model
        self.sentiment_analyzer = None
        self.model_name = "ProsusAI/finbert"

    def get_sentiment_analyzer(self):
        """Lazy initialization of FinBERT model"""
        if self.sentiment_analyzer is None:
            model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
            tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.sentiment_analyzer = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)
        return self.sentiment_analyzer

    def calculate_var(self, returns: pd.Series, confidence_level: float = 0.95, timeframe: str = 'daily') -> float:
        """Calculate Value at Risk using historical simulation method
        
        Args:
            returns: pandas Series of historical returns
            confidence_level: confidence level for VaR calculation (default: 0.95)
            timeframe: 'daily', 'weekly', or 'monthly'
        
        Returns:
            Value at Risk estimate
        """
        # Sort returns in ascending order
        sorted_returns = np.sort(returns)
        
        # Find the index at the confidence level
        index = int((1 - confidence_level) * len(sorted_returns))
        
        # Get the VaR value
        var = -sorted_returns[index]
        
        # Scale VaR based on timeframe
        if timeframe == 'weekly':
            var *= np.sqrt(5)  # Assuming 5 trading days in a week
        elif timeframe == 'monthly':
            var *= np.sqrt(21)  # Assuming 21 trading days in a month
        
        return var

    def calculate_portfolio_var(self, 
                              symbols: List[str], 
                              weights: np.ndarray, 
                              confidence_level: float = 0.95,
                              timeframe: str = 'daily') -> Dict[str, float]:
        """Calculate portfolio VaR using historical simulation
        
        Args:
            symbols: List of stock symbols
            weights: Array of portfolio weights
            confidence_level: Confidence level for VaR
            timeframe: Calculation timeframe
            
        Returns:
            Dictionary containing VaR metrics
        """
        try:
            # Fetch historical data (1 year)
            data = yf.download(symbols, period="1y", interval="1d")['Adj Close']
            returns = data.pct_change().dropna()
            
            # Calculate portfolio returns
            portfolio_returns = returns.dot(weights)
            
            # Calculate VaR for different timeframes
            var_metrics = {
                'daily_var': self.calculate_var(portfolio_returns, confidence_level, 'daily'),
                'weekly_var': self.calculate_var(portfolio_returns, confidence_level, 'weekly'),
                'monthly_var': self.calculate_var(portfolio_returns, confidence_level, 'monthly')
            }
            
            # Calculate additional risk metrics
            volatility = np.std(portfolio_returns) * np.sqrt(252)  # Annualized
            expected_return = np.mean(portfolio_returns) * 252  # Annualized
            
            # Add metrics to result
            var_metrics.update({
                'volatility': volatility,
                'expected_return': expected_return,
                'sharpe_ratio': (expected_return - 0.04) / volatility  # Assuming 4% risk-free rate
            })
            
            return var_metrics
            
        except Exception as e:
            raise Exception(f"Error calculating portfolio VaR: {str(e)}")

    def analyze_sentiment(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Analyze sentiment of financial texts using FinBERT
        
        Args:
            texts: List of financial texts to analyze
            
        Returns:
            List of sentiment analysis results
        """
        try:
            analyzer = self.get_sentiment_analyzer()
            results = []
            
            for text in texts:
                # Get raw sentiment prediction
                prediction = analyzer(text)[0]
                
                # Map FinBERT labels to scores
                label_map = {
                    "positive": 1.0,
                    "neutral": 0.0,
                    "negative": -1.0
                }
                
                # Create result object
                result = {
                    'text': text[:500],  # Store snippet only
                    'sentiment_score': label_map.get(prediction["label"], 0.0),
                    'confidence': prediction["score"],
                    'label': prediction["label"],
                    'analysis_date': datetime.utcnow()
                }
                
                results.append(result)
            
            return results
            
        except Exception as e:
            raise Exception(f"Error analyzing sentiment: {str(e)}")

# Create singleton instance
analysis_service = AnalysisService()