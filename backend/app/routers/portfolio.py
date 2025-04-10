from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import models, schemas
from ..auth.auth import get_current_active_user

router = APIRouter()


@router.post("/", response_model=schemas.PortfolioResponse)
async def create_portfolio(
    portfolio: schemas.PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_portfolio = models.Portfolio(
        name=portfolio.name,
        description=portfolio.description,
        owner_id=current_user.id
    )
    db.add(db_portfolio)
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio


@router.get("/", response_model=List[schemas.PortfolioResponse])
async def read_portfolios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    portfolios = db.query(models.Portfolio).filter(
        models.Portfolio.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return portfolios


@router.get("/{portfolio_id}", response_model=schemas.PortfolioResponse)
async def read_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.owner_id == current_user.id
    ).first()
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio


@router.put("/{portfolio_id}", response_model=schemas.PortfolioResponse)
async def update_portfolio(
    portfolio_id: int,
    portfolio: schemas.PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.owner_id == current_user.id
    ).first()
    if db_portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    db_portfolio.name = portfolio.name
    db_portfolio.description = portfolio.description
    db_portfolio.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_portfolio)
    return db_portfolio


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.owner_id == current_user.id
    ).first()
    if db_portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    db.delete(db_portfolio)
    db.commit()
    return None


# Holdings endpoints
@router.post("/{portfolio_id}/holdings", response_model=schemas.HoldingResponse)
async def create_holding(
    portfolio_id: int,
    holding: schemas.HoldingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify portfolio belongs to user
    portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.owner_id == current_user.id
    ).first()
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Verify stock exists
    stock = db.query(models.Stock).filter(models.Stock.id == holding.stock_id).first()
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    # Check if holding already exists
    existing_holding = db.query(models.Holding).filter(
        models.Holding.portfolio_id == portfolio_id,
        models.Holding.stock_id == holding.stock_id
    ).first()
    
    if existing_holding:
        # Update existing holding
        existing_holding.quantity = holding.quantity
        existing_holding.average_buy_price = holding.average_buy_price
        existing_holding.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_holding)
        return existing_holding
    else:
        # Create new holding
        db_holding = models.Holding(
            portfolio_id=portfolio_id,
            stock_id=holding.stock_id,
            quantity=holding.quantity,
            average_buy_price=holding.average_buy_price
        )
        db.add(db_holding)
        db.commit()
        db.refresh(db_holding)
        return db_holding


@router.get("/{portfolio_id}/holdings", response_model=List[schemas.HoldingResponse])
async def read_holdings(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify portfolio belongs to user
    portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.owner_id == current_user.id
    ).first()
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    holdings = db.query(models.Holding).filter(
        models.Holding.portfolio_id == portfolio_id
    ).all()
    return holdings


@router.delete("/{portfolio_id}/holdings/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_holding(
    portfolio_id: int,
    holding_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify portfolio belongs to user
    portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.owner_id == current_user.id
    ).first()
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get holding
    holding = db.query(models.Holding).filter(
        models.Holding.id == holding_id,
        models.Holding.portfolio_id == portfolio_id
    ).first()
    if holding is None:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    db.delete(holding)
    db.commit()
    return None


# Transactions endpoints
@router.post("/{portfolio_id}/transactions", response_model=schemas.TransactionResponse)
async def create_transaction(
    portfolio_id: int,
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify portfolio belongs to user
    portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.owner_id == current_user.id
    ).first()
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Verify stock exists
    stock = db.query(models.Stock).filter(models.Stock.id == transaction.stock_id).first()
    if stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    
    # Create transaction
    db_transaction = models.Transaction(
        portfolio_id=portfolio_id,
        stock_id=transaction.stock_id,
        transaction_type=transaction.transaction_type,
        quantity=transaction.quantity,
        price=transaction.price,
        transaction_date=transaction.transaction_date or datetime.utcnow(),
        notes=transaction.notes
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    # Update or create holding
    holding = db.query(models.Holding).filter(
        models.Holding.portfolio_id == portfolio_id,
        models.Holding.stock_id == transaction.stock_id
    ).first()
    
    if transaction.transaction_type == "BUY":
        if holding:
            # Update existing holding
            total_value = (holding.quantity * holding.average_buy_price) + (transaction.quantity * transaction.price)
            total_quantity = holding.quantity + transaction.quantity
            holding.average_buy_price = total_value / total_quantity if total_quantity > 0 else 0
            holding.quantity = total_quantity
        else:
            # Create new holding
            holding = models.Holding(
                portfolio_id=portfolio_id,
                stock_id=transaction.stock_id,
                quantity=transaction.quantity,
                average_buy_price=transaction.price
            )
            db.add(holding)
    elif transaction.transaction_type == "SELL":
        if not holding or holding.quantity < transaction.quantity:
            raise HTTPException(status_code=400, detail="Not enough shares to sell")
        
        holding.quantity -= transaction.quantity
        if holding.quantity == 0:
            db.delete(holding)
    
    db.commit()
    return db_transaction


@router.get("/{portfolio_id}/transactions", response_model=List[schemas.TransactionResponse])
async def read_transactions(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify portfolio belongs to user
    portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.owner_id == current_user.id
    ).first()
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    transactions = db.query(models.Transaction).filter(
        models.Transaction.portfolio_id == portfolio_id
    ).order_by(models.Transaction.transaction_date.desc()).all()
    return transactions


@router.get("/{portfolio_id}/summary", response_model=schemas.PortfolioSummary)
async def get_portfolio_summary(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify portfolio belongs to user
    portfolio = db.query(models.Portfolio).filter(
        models.Portfolio.id == portfolio_id,
        models.Portfolio.owner_id == current_user.id
    ).first()
    if portfolio is None:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get holdings
    holdings = db.query(models.Holding).filter(
        models.Holding.portfolio_id == portfolio_id
    ).all()
    
    # Calculate portfolio value
    total_value = 0.0
    total_cost = 0.0
    
    for holding in holdings:
        stock = db.query(models.Stock).filter(models.Stock.id == holding.stock_id).first()
        if stock and stock.current_price:
            total_value += holding.quantity * stock.current_price
            total_cost += holding.quantity * holding.average_buy_price
    
    # Get risk analysis
    risk_analysis = db.query(models.RiskAnalysis).filter(
        models.RiskAnalysis.portfolio_id == portfolio_id
    ).order_by(models.RiskAnalysis.analysis_date.desc()).first()
    
    # Calculate returns
    overall_return = total_value - total_cost
    overall_return_percent = (overall_return / total_cost * 100) if total_cost > 0 else 0
    
    # For simplicity, we're using placeholder values for daily change
    # In a real app, you would calculate this based on previous day's closing values
    daily_change = 0.0
    daily_change_percent = 0.0
    
    return {
        "portfolio": portfolio,
        "total_value": total_value,
        "daily_change": daily_change,
        "daily_change_percent": daily_change_percent,
        "overall_return": overall_return,
        "overall_return_percent": overall_return_percent,
        "holdings": holdings,
        "risk_analysis": risk_analysis
    }