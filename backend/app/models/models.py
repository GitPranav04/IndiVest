from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    portfolios = relationship("Portfolio", back_populates="owner")
    watchlists = relationship("Watchlist", back_populates="owner")


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="portfolios")
    holdings = relationship("Holding", back_populates="portfolio")
    transactions = relationship("Transaction", back_populates="portfolio")


class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    sector = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    current_price = Column(Float, nullable=True)
    last_updated = Column(DateTime, nullable=True)

    # Relationships
    holdings = relationship("Holding", back_populates="stock")
    transactions = relationship("Transaction", back_populates="stock")
    watchlist_items = relationship("WatchlistItem", back_populates="stock")


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    quantity = Column(Float)
    average_buy_price = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="holdings")
    stock = relationship("Stock", back_populates="holdings")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    transaction_type = Column(String)  # "BUY" or "SELL"
    quantity = Column(Float)
    price = Column(Float)
    transaction_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(String, nullable=True)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="transactions")
    stock = relationship("Stock", back_populates="transactions")


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="watchlists")
    items = relationship("WatchlistItem", back_populates="watchlist")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, index=True)
    watchlist_id = Column(Integer, ForeignKey("watchlists.id"))
    stock_id = Column(Integer, ForeignKey("stocks.id"))
    added_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    watchlist = relationship("Watchlist", back_populates="items")
    stock = relationship("Stock", back_populates="watchlist_items")


class RiskAnalysis(Base):
    __tablename__ = "risk_analyses"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"))
    risk_score = Column(Float)
    volatility = Column(Float)
    sharpe_ratio = Column(Float, nullable=True)
    var_95 = Column(Float, nullable=True)  # Value at Risk (95% confidence)
    analysis_date = Column(DateTime, default=datetime.utcnow)
    recommendations = Column(JSON, nullable=True)

    # Relationship
    portfolio = relationship("Portfolio")


class SentimentAnalysis(Base):
    __tablename__ = "sentiment_analyses"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=True)
    source = Column(String)  # e.g., "news", "twitter", "reddit"
    sentiment_score = Column(Float)  # -1 to 1 scale
    confidence = Column(Float)
    text_snippet = Column(Text, nullable=True)
    source_url = Column(String, nullable=True)
    analysis_date = Column(DateTime, default=datetime.utcnow)

    # Relationship
    stock = relationship("Stock")


class MarketIndex(Base):
    __tablename__ = "market_indices"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    name = Column(String)
    current_value = Column(Float, nullable=True)
    change_percent = Column(Float, nullable=True)
    last_updated = Column(DateTime, nullable=True)