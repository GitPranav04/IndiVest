from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import requests
from bs4 import BeautifulSoup
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
import torch

from ..database import get_db
from ..models import models, schemas
from ..auth.auth import get_current_active_user

router = APIRouter()

# Download NLTK resources if not already downloaded
try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

# Initialize sentiment analyzers
vader_analyzer = SentimentIntensityAnalyzer()

# For more advanced sentiment analysis, we'll use a pre-trained transformer model
# This will be initialized on first use to save memory
transformer_analyzer = None


def get_transformer_analyzer():
    global transformer_analyzer
    if transformer_analyzer is None:
        # Use FinBERT model which is fine-tuned for financial text
        model_name = "ProsusAI/finbert"
        model = AutoModelForSequenceClassification.from_pretrained(model_name)
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        transformer_analyzer = pipeline("sentiment-analysis", model=model, tokenizer=tokenizer)
    return transformer_analyzer


@router.post("/analyze", response_model=schemas.SentimentAnalysisResponse)
async def analyze_text_sentiment(
    text: str = Query(..., min_length=10),
    stock_id: Optional[int] = None,
    source: str = "custom",
    use_advanced_model: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify stock exists if stock_id is provided
    stock = None
    if stock_id:
        stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
        if stock is None:
            raise HTTPException(status_code=404, detail="Stock not found")
    
    try:
        # Analyze sentiment
        if use_advanced_model:
            # Use transformer model (more accurate but slower)
            analyzer = get_transformer_analyzer()
            result = analyzer(text)[0]
            
            # Map FinBERT labels to scores
            label_map = {
                "positive": 1.0,
                "neutral": 0.0,
                "negative": -1.0
            }
            
            sentiment_score = label_map.get(result["label"], 0.0)
            confidence = result["score"]
        else:
            # Use VADER (faster but less accurate for financial text)
            scores = vader_analyzer.polarity_scores(text)
            sentiment_score = scores["compound"]  # -1 to 1 scale
            confidence = max(scores["pos"], scores["neg"], scores["neu"])
        
        # Create sentiment analysis record
        db_sentiment = models.SentimentAnalysis(
            stock_id=stock_id,
            source=source,
            sentiment_score=sentiment_score,
            confidence=confidence,
            text_snippet=text[:500] if len(text) > 500 else text,  # Store only a snippet
            analysis_date=datetime.utcnow()
        )
        
        db.add(db_sentiment)
        db.commit()
        db.refresh(db_sentiment)
        
        return db_sentiment
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment: {str(e)}")


@router.get("/stock/{stock_id}", response_model=List[schemas.SentimentAnalysisResponse])
async def get_stock_sentiment(
    stock_id: int,
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify stock exists
    stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    # Get sentiment analyses for the stock
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    analyses = db.query(models.SentimentAnalysis).filter(
        models.SentimentAnalysis.stock_id == stock_id,
        models.SentimentAnalysis.analysis_date >= cutoff_date
    ).order_by(models.SentimentAnalysis.analysis_date.desc()).all()
    
    return analyses


@router.get("/news", response_model=List[Dict[str, Any]])
async def get_market_news(
    query: Optional[str] = None,
    stock_symbol: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # This is a simplified implementation
    # In a real application, you would use a proper news API or web scraping with proper rate limiting
    
    news_items = []
    search_term = query or stock_symbol or "indian stock market"
    
    try:
        # For demo purposes, we'll return some mock news data
        # In a real app, you would integrate with a news API or implement web scraping
        mock_news = [
            {
                "title": "Sensex, Nifty hit record highs as IT stocks surge",
                "source": "Economic Times",
                "url": "https://economictimes.indiatimes.com/markets/stocks/news/",
                "published_date": (datetime.utcnow() - timedelta(hours=3)).isoformat(),
                "snippet": "Indian benchmark indices Sensex and Nifty hit record highs on Wednesday, led by gains in IT stocks following strong quarterly results."
            },
            {
                "title": "RBI keeps repo rate unchanged at 6.5%",
                "source": "Business Standard",
                "url": "https://www.business-standard.com/finance/news/",
                "published_date": (datetime.utcnow() - timedelta(hours=5)).isoformat(),
                "snippet": "The Reserve Bank of India (RBI) kept the repo rate unchanged at 6.5% for the fifth consecutive time, maintaining its focus on inflation control."
            },
            {
                "title": "FIIs turn net buyers in Indian equities after three months",
                "source": "Mint",
                "url": "https://www.livemint.com/market/stock-market-news/",
                "published_date": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "snippet": "Foreign institutional investors (FIIs) turned net buyers in Indian equities after three months of continuous selling, signaling renewed confidence in the market."
            },
            {
                "title": "IT sector outlook improves as companies report strong deal pipeline",
                "source": "Financial Express",
                "url": "https://www.financialexpress.com/market/",
                "published_date": (datetime.utcnow() - timedelta(days=2)).isoformat(),
                "snippet": "The outlook for India's IT sector has improved as major companies reported a strong deal pipeline and better-than-expected quarterly results."
            },
            {
                "title": "Pharma stocks rally on positive regulatory developments",
                "source": "CNBC-TV18",
                "url": "https://www.cnbctv18.com/market/",
                "published_date": (datetime.utcnow() - timedelta(days=2, hours=12)).isoformat(),
                "snippet": "Pharmaceutical stocks rallied on Wednesday following positive regulatory developments and approval of new drugs by the US FDA."
            }
        ]
        
        # Filter by search term if provided
        if search_term:
            filtered_news = []
            for news in mock_news:
                if (search_term.lower() in news["title"].lower() or 
                    search_term.lower() in news["snippet"].lower()):
                    filtered_news.append(news)
            mock_news = filtered_news
        
        # Analyze sentiment for each news item
        for news in mock_news[:limit]:
            sentiment = vader_analyzer.polarity_scores(news["title"] + " " + news["snippet"])
            news["sentiment_score"] = sentiment["compound"]
            news_items.append(news)
        
        return news_items
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching news: {str(e)}")


@router.post("/analyze/news", response_model=Dict[str, Any])
async def analyze_news_sentiment(
    stock_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify stock exists
    stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    try:
        # Get news for the stock
        news = await get_market_news(stock_symbol=stock.symbol, limit=10, db=db, current_user=current_user)
        
        if not news:
            return {
                "stock_symbol": stock.symbol,
                "stock_name": stock.name,
                "average_sentiment": 0,
                "sentiment_count": 0,
                "news_analyzed": []
            }
        
        # Analyze each news item and store in database
        analyzed_news = []
        total_sentiment = 0
        
        for item in news:
            # Create sentiment analysis record
            db_sentiment = models.SentimentAnalysis(
                stock_id=stock_id,
                source="news",
                sentiment_score=item["sentiment_score"],
                confidence=0.8,  # Placeholder confidence
                text_snippet=item["snippet"],
                source_url=item["url"],
                analysis_date=datetime.utcnow()
            )
            
            db.add(db_sentiment)
            total_sentiment += item["sentiment_score"]
            
            analyzed_news.append({
                "title": item["title"],
                "source": item["source"],
                "sentiment_score": item["sentiment_score"],
                "published_date": item["published_date"]
            })
        
        db.commit()
        
        # Calculate average sentiment
        average_sentiment = total_sentiment / len(news) if news else 0
        
        return {
            "stock_symbol": stock.symbol,
            "stock_name": stock.name,
            "average_sentiment": average_sentiment,
            "sentiment_count": len(news),
            "news_analyzed": analyzed_news
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing news sentiment: {str(e)}")


@router.get("/market/sentiment", response_model=Dict[str, Any])
async def get_market_sentiment(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    try:
        # Get overall market sentiment
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        analyses = db.query(models.SentimentAnalysis).filter(
            models.SentimentAnalysis.analysis_date >= cutoff_date
        ).all()
        
        if not analyses:
            return {
                "average_sentiment": 0,
                "sentiment_count": 0,
                "sentiment_distribution": {
                    "positive": 0,
                    "neutral": 0,
                    "negative": 0
                },
                "sentiment_trend": []
            }
        
        # Calculate average sentiment
        total_sentiment = sum(analysis.sentiment_score for analysis in analyses)
        average_sentiment = total_sentiment / len(analyses) if analyses else 0
        
        # Calculate sentiment distribution
        positive_count = sum(1 for analysis in analyses if analysis.sentiment_score > 0.2)
        negative_count = sum(1 for analysis in analyses if analysis.sentiment_score < -0.2)
        neutral_count = len(analyses) - positive_count - negative_count
        
        # Calculate sentiment trend (daily average)
        sentiment_by_date = {}
        for analysis in analyses:
            date_str = analysis.analysis_date.strftime("%Y-%m-%d")
            if date_str not in sentiment_by_date:
                sentiment_by_date[date_str] = []
            sentiment_by_date[date_str].append(analysis.sentiment_score)
        
        sentiment_trend = [
            {
                "date": date,
                "sentiment": sum(scores) / len(scores) if scores else 0
            }
            for date, scores in sentiment_by_date.items()
        ]
        
        # Sort by date
        sentiment_trend.sort(key=lambda x: x["date"])
        
        return {
            "average_sentiment": average_sentiment,
            "sentiment_count": len(analyses),
            "sentiment_distribution": {
                "positive": positive_count,
                "neutral": neutral_count,
                "negative": negative_count
            },
            "sentiment_trend": sentiment_trend
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting market sentiment: {str(e)}")


@router.get("/top-sentiment", response_model=List[Dict[str, Any]])
async def get_top_sentiment_stocks(
    limit: int = Query(10, ge=1, le=50),
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    try:
        # Get stocks with sentiment analysis in the specified period
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # This query gets the average sentiment score for each stock
        # In SQLAlchemy Core syntax for more complex aggregation
        from sqlalchemy import func, desc
        
        query = db.query(
            models.Stock.id,
            models.Stock.symbol,
            models.Stock.name,
            func.avg(models.SentimentAnalysis.sentiment_score).label("avg_sentiment"),
            func.count(models.SentimentAnalysis.id).label("analysis_count")
        ).join(
            models.SentimentAnalysis,
            models.Stock.id == models.SentimentAnalysis.stock_id
        ).filter(
            models.SentimentAnalysis.analysis_date >= cutoff_date
        ).group_by(
            models.Stock.id
        ).having(
            func.count(models.SentimentAnalysis.id) >= 3  # At least 3 analyses
        ).order_by(
            desc("avg_sentiment")
        ).limit(limit).all()
        
        result = [
            {
                "stock_id": row[0],
                "symbol": row[1],
                "name": row[2],
                "average_sentiment": float(row[3]),  # Convert Decimal to float for JSON
                "analysis_count": row[4]
            }
            for row in query
        ]
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting top sentiment stocks: {str(e)}")