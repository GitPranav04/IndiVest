from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd
import numpy as np

from ..database import get_db
from ..models import models, schemas
from ..auth.auth import get_current_active_user

router = APIRouter()

# Indian market indices
INDIAN_INDICES = {
    "^NSEI": "NIFTY 50",
    "^BSESN": "BSE SENSEX",
    "^NSEBANK": "NIFTY BANK",
    "^CNXIT": "NIFTY IT",
    "^CNXPHARMA": "NIFTY PHARMA",
    "^CNXAUTO": "NIFTY AUTO"
}


@router.get("/stocks", response_model=List[schemas.StockResponse])
async def get_stocks(
    search: Optional[str] = None,
    sector: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    query = db.query(models.Stock)
    
    if search:
        query = query.filter(
            (models.Stock.name.ilike(f"%{search}%")) | 
            (models.Stock.symbol.ilike(f"%{search}%"))
        )
    
    if sector:
        query = query.filter(models.Stock.sector == sector)
    
    stocks = query.offset(skip).limit(limit).all()
    return stocks


@router.get("/stocks/{stock_id}", response_model=schemas.StockResponse)
async def get_stock(
    stock_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock


@router.get("/stocks/symbol/{symbol}", response_model=schemas.StockResponse)
async def get_stock_by_symbol(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    stock = db.query(models.Stock).filter(models.Stock.symbol == symbol).first()
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock


@router.post("/stocks", response_model=schemas.StockResponse)
async def create_stock(
    stock: schemas.StockCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Check if stock already exists
    existing_stock = db.query(models.Stock).filter(models.Stock.symbol == stock.symbol).first()
    if existing_stock:
        raise HTTPException(status_code=400, detail="Stock already exists")
    
    # Create new stock
    db_stock = models.Stock(
        symbol=stock.symbol,
        name=stock.name,
        sector=stock.sector,
        industry=stock.industry
    )
    
    # Try to fetch current price from yfinance
    try:
        ticker = yf.Ticker(stock.symbol)
        data = ticker.history(period="1d")
        if not data.empty:
            db_stock.current_price = data['Close'].iloc[-1]
            db_stock.last_updated = datetime.utcnow()
    except Exception as e:
        # Just log the error, don't fail the request
        print(f"Error fetching price for {stock.symbol}: {e}")
    
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock


@router.get("/indices", response_model=List[schemas.MarketIndexResponse])
async def get_market_indices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Get indices from database
    indices = db.query(models.MarketIndex).all()
    
    # If no indices in database, fetch and store them
    if not indices:
        for symbol, name in INDIAN_INDICES.items():
            db_index = models.MarketIndex(symbol=symbol, name=name)
            db.add(db_index)
        db.commit()
        indices = db.query(models.MarketIndex).all()
    
    # Update indices with latest data
    update_needed = False
    for index in indices:
        # Check if update is needed (last update more than 1 hour ago)
        if not index.last_updated or (datetime.utcnow() - index.last_updated) > timedelta(hours=1):
            update_needed = True
            break
    
    if update_needed:
        await update_market_indices(db)
        indices = db.query(models.MarketIndex).all()
    
    return indices


async def update_market_indices(db: Session):
    """Update market indices with latest data from yfinance"""
    try:
        # Fetch all indices at once
        symbols = list(INDIAN_INDICES.keys())
        data = yf.download(symbols, period="1d")
        
        for symbol in symbols:
            if 'Close' in data and symbol in data['Close']:
                close_price = data['Close'][symbol].iloc[-1]
                prev_close = data['Close'][symbol].iloc[0] if len(data['Close']) > 1 else close_price
                change_percent = ((close_price - prev_close) / prev_close * 100) if prev_close > 0 else 0
                
                # Update in database
                db_index = db.query(models.MarketIndex).filter(models.MarketIndex.symbol == symbol).first()
                if db_index:
                    db_index.current_value = close_price
                    db_index.change_percent = change_percent
                    db_index.last_updated = datetime.utcnow()
        
        db.commit()
    except Exception as e:
        print(f"Error updating market indices: {e}")


@router.get("/stocks/{stock_id}/historical", response_model=dict)
async def get_stock_historical_data(
    stock_id: int,
    period: str = Query("1mo", description="Data period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max"),
    interval: str = Query("1d", description="Data interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Get stock
    stock = db.query(models.Stock).filter(models.Stock.id == stock_id).first()
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    # Fetch historical data
    try:
        ticker = yf.Ticker(stock.symbol)
        hist = ticker.history(period=period, interval=interval)
        
        # Convert to list of dictionaries for JSON response
        data = []
        for date, row in hist.iterrows():
            data.append({
                "date": date.strftime("%Y-%m-%d %H:%M:%S"),
                "open": row["Open"],
                "high": row["High"],
                "low": row["Low"],
                "close": row["Close"],
                "volume": row["Volume"]
            })
        
        return {
            "symbol": stock.symbol,
            "name": stock.name,
            "period": period,
            "interval": interval,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching historical data: {str(e)}")


@router.get("/search", response_model=List[schemas.StockResponse])
async def search_stocks(
    query: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Search in database
    stocks = db.query(models.Stock).filter(
        (models.Stock.symbol.ilike(f"%{query}%")) | 
        (models.Stock.name.ilike(f"%{query}%"))
    ).limit(10).all()
    
    return stocks


@router.get("/sectors", response_model=List[str])
async def get_sectors(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Get unique sectors
    sectors = db.query(models.Stock.sector).distinct().filter(models.Stock.sector != None).all()
    return [sector[0] for sector in sectors]


@router.get("/industries", response_model=List[str])
async def get_industries(
    sector: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Build query
    query = db.query(models.Stock.industry).distinct().filter(models.Stock.industry != None)
    
    if sector:
        query = query.filter(models.Stock.sector == sector)
    
    industries = query.all()
    return [industry[0] for industry in industries]