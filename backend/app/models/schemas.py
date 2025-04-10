from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Portfolio schemas
class PortfolioBase(BaseModel):
    name: str
    description: Optional[str] = None

class PortfolioCreate(PortfolioBase):
    pass

class PortfolioResponse(PortfolioBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Stock schemas
class StockBase(BaseModel):
    symbol: str
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None

class StockCreate(StockBase):
    pass

class StockResponse(StockBase):
    id: int
    current_price: Optional[float] = None
    last_updated: Optional[datetime] = None

    class Config:
        orm_mode = True

# Holding schemas
class HoldingBase(BaseModel):
    stock_id: int
    quantity: float
    average_buy_price: float

class HoldingCreate(HoldingBase):
    portfolio_id: int

class HoldingResponse(HoldingBase):
    id: int
    portfolio_id: int
    created_at: datetime
    updated_at: datetime
    stock: StockResponse

    class Config:
        orm_mode = True

# Transaction schemas
class TransactionBase(BaseModel):
    stock_id: int
    transaction_type: str
    quantity: float
    price: float
    transaction_date: Optional[datetime] = None
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    portfolio_id: int

class TransactionResponse(TransactionBase):
    id: int
    portfolio_id: int
    stock: StockResponse

    class Config:
        orm_mode = True

# Watchlist schemas
class WatchlistBase(BaseModel):
    name: str

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistItemCreate(BaseModel):
    stock_id: int

class WatchlistItemResponse(BaseModel):
    id: int
    stock: StockResponse
    added_at: datetime

    class Config:
        orm_mode = True

class WatchlistResponse(WatchlistBase):
    id: int
    owner_id: int
    created_at: datetime
    items: List[WatchlistItemResponse] = []

    class Config:
        orm_mode = True

# Risk Analysis schemas
class RiskAnalysisBase(BaseModel):
    portfolio_id: int
    risk_score: float
    volatility: float
    sharpe_ratio: Optional[float] = None
    var_95: Optional[float] = None
    recommendations: Optional[Dict[str, Any]] = None

class RiskAnalysisCreate(RiskAnalysisBase):
    pass

class RiskAnalysisResponse(RiskAnalysisBase):
    id: int
    analysis_date: datetime

    class Config:
        orm_mode = True

# Sentiment Analysis schemas
class SentimentAnalysisBase(BaseModel):
    stock_id: Optional[int] = None
    source: str
    sentiment_score: float
    confidence: float
    text_snippet: Optional[str] = None
    source_url: Optional[str] = None

class SentimentAnalysisCreate(SentimentAnalysisBase):
    pass

class SentimentAnalysisResponse(SentimentAnalysisBase):
    id: int
    analysis_date: datetime
    stock: Optional[StockResponse] = None

    class Config:
        orm_mode = True

# Market Index schemas
class MarketIndexBase(BaseModel):
    symbol: str
    name: str

class MarketIndexCreate(MarketIndexBase):
    pass

class MarketIndexResponse(MarketIndexBase):
    id: int
    current_value: Optional[float] = None
    change_percent: Optional[float] = None
    last_updated: Optional[datetime] = None

    class Config:
        orm_mode = True

# Portfolio Summary
class PortfolioSummary(BaseModel):
    portfolio: PortfolioResponse
    total_value: float
    daily_change: float
    daily_change_percent: float
    overall_return: float
    overall_return_percent: float
    holdings: List[HoldingResponse]
    risk_analysis: Optional[RiskAnalysisResponse] = None

# Dashboard Data
class DashboardData(BaseModel):
    portfolios_summary: List[PortfolioSummary]
    market_indices: List[MarketIndexResponse]
    recent_transactions: List[TransactionResponse]
    watchlists: List[WatchlistResponse]
    top_sentiment_stocks: List[Dict[str, Any]]