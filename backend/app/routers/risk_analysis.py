from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
import yfinance as yf
from sklearn.covariance import LedoitWolf

from ..database import get_db
from ..models import models, schemas
from ..auth.auth import get_current_active_user

router = APIRouter()


from ..services.analysis_service import analysis_service

@router.post("/analyze/{portfolio_id}", response_model=schemas.RiskAnalysisResponse)
async def analyze_portfolio_risk(
    portfolio_id: int,
    confidence_level: float = Query(0.95, gt=0, lt=1),
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
    
    if not holdings:
        raise HTTPException(status_code=400, detail="Portfolio has no holdings")
    
    # Get stock symbols and weights
    symbols = []
    weights = []
    total_value = 0
    
    for holding in holdings:
        stock = db.query(models.Stock).filter(models.Stock.id == holding.stock_id).first()
        if stock and stock.current_price:
            symbols.append(stock.symbol)
            value = holding.quantity * stock.current_price
            total_value += value
            weights.append(value)
    
    if not symbols:
        raise HTTPException(status_code=400, detail="No valid stocks in portfolio")
    
    # Normalize weights
    weights = np.array(weights) / total_value if total_value > 0 else np.array([1/len(weights)] * len(weights))
    
    try:
        # Fetch historical data (1 year)
        data = yf.download(symbols, period="1y", interval="1d")['Adj Close']
        
        # Calculate daily returns
        returns = data.pct_change().dropna()
        
        # Calculate portfolio volatility (annualized)
        if len(symbols) > 1:
            # Use Ledoit-Wolf shrinkage for better covariance estimation
            cov_matrix = LedoitWolf().fit(returns).covariance_
            portfolio_variance = weights.T @ cov_matrix @ weights
        else:
            # Single stock case
            portfolio_variance = returns.var()[0]
        
        volatility = np.sqrt(portfolio_variance) * np.sqrt(252)  # Annualized
        
        # Calculate expected return (annualized)
        expected_return = np.sum(returns.mean() * weights) * 252
        
        # Calculate Sharpe ratio (assuming risk-free rate of 4%)
        risk_free_rate = 0.04
        sharpe_ratio = (expected_return - risk_free_rate) / volatility if volatility > 0 else 0
        
        # Calculate VaR and other risk metrics using analysis service
        risk_metrics = analysis_service.calculate_portfolio_var(
            symbols=symbols,
            weights=weights,
            confidence_level=confidence_level
        )
        
        # Calculate risk score (1-10 scale)
        risk_factors = [
            risk_metrics['volatility'] / 0.3,  # Scale volatility (30% annual is high risk)
            risk_metrics['daily_var'] / 0.03,   # Scale daily VaR (3% daily is high risk)
            abs(risk_metrics['sharpe_ratio'] - 2) / 2  # Deviation from ideal Sharpe ratio of 2
        ]
        risk_score = min(10, max(1, round(np.mean(risk_factors) * 10)))
        
        # Generate recommendations based on comprehensive risk metrics
        recommendations = generate_recommendations(
            returns=returns,
            weights=weights,
            symbols=symbols,
            risk_score=risk_score,
            risk_metrics=risk_metrics
        )
        
        # Create risk analysis record
        risk_analysis = models.RiskAnalysis(
            portfolio_id=portfolio_id,
            risk_score=risk_score,
            volatility=volatility,
            sharpe_ratio=sharpe_ratio,
            var_95=var_95,
            recommendations=recommendations,
            analysis_date=datetime.utcnow()
        )
        
        db.add(risk_analysis)
        db.commit()
        db.refresh(risk_analysis)
        
        return risk_analysis
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing portfolio risk: {str(e)}")


def generate_recommendations(returns, weights, symbols, risk_score):
    """Generate portfolio optimization recommendations"""
    recommendations = {
        "summary": "",
        "diversification": "",
        "sector_exposure": "",
        "optimization": []
    }
    
    # Calculate correlation matrix
    corr_matrix = returns.corr()
    
    # Check diversification
    avg_correlation = corr_matrix.values[np.triu_indices_from(corr_matrix.values, 1)].mean()
    
    if avg_correlation > 0.7:
        recommendations["diversification"] = "Your portfolio shows high correlation between assets. Consider adding uncorrelated assets to improve diversification."
    elif avg_correlation > 0.5:
        recommendations["diversification"] = "Your portfolio has moderate diversification. Consider adding assets from different sectors to reduce correlation."
    else:
        recommendations["diversification"] = "Your portfolio is well-diversified with low correlation between assets."
    
    # Risk-based summary
    if risk_score >= 8:
        recommendations["summary"] = "Your portfolio has a high risk profile. Consider reducing exposure to volatile assets if this exceeds your risk tolerance."
    elif risk_score >= 5:
        recommendations["summary"] = "Your portfolio has a moderate risk profile, which is suitable for balanced investment goals."
    else:
        recommendations["summary"] = "Your portfolio has a conservative risk profile with lower potential returns but better capital preservation."
    
    # Simple optimization suggestions
    # In a real system, you would use more sophisticated optimization techniques
    for i, symbol in enumerate(symbols):
        # Identify assets with poor risk-return characteristics
        asset_return = returns[symbol].mean() * 252  # Annualized return
        asset_risk = returns[symbol].std() * np.sqrt(252)  # Annualized volatility
        asset_sharpe = asset_return / asset_risk if asset_risk > 0 else 0
        
        if asset_sharpe < 0.1 and weights[i] > 0.1:
            recommendations["optimization"].append({
                "symbol": symbol,
                "action": "reduce",
                "reason": f"Poor risk-adjusted return (Sharpe ratio: {asset_sharpe:.2f})"
            })
    
    return recommendations


@router.get("/{portfolio_id}/history", response_model=List[schemas.RiskAnalysisResponse])
async def get_risk_analysis_history(
    portfolio_id: int,
    limit: int = 10,
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
    
    # Get risk analysis history
    analyses = db.query(models.RiskAnalysis).filter(
        models.RiskAnalysis.portfolio_id == portfolio_id
    ).order_by(models.RiskAnalysis.analysis_date.desc()).limit(limit).all()
    
    return analyses


@router.get("/{portfolio_id}/latest", response_model=schemas.RiskAnalysisResponse)
async def get_latest_risk_analysis(
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
    
    # Get latest risk analysis
    analysis = db.query(models.RiskAnalysis).filter(
        models.RiskAnalysis.portfolio_id == portfolio_id
    ).order_by(models.RiskAnalysis.analysis_date.desc()).first()
    
    if analysis is None:
        raise HTTPException(status_code=404, detail="No risk analysis found for this portfolio")
    
    return analysis


@router.get("/compare", response_model=Dict[str, Any])
async def compare_portfolio_risks(
    portfolio_ids: List[int] = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    if len(portfolio_ids) < 2:
        raise HTTPException(status_code=400, detail="Please provide at least two portfolio IDs for comparison")
    
    result = {}
    
    for portfolio_id in portfolio_ids:
        # Verify portfolio belongs to user
        portfolio = db.query(models.Portfolio).filter(
            models.Portfolio.id == portfolio_id,
            models.Portfolio.owner_id == current_user.id
        ).first()
        if portfolio is None:
            raise HTTPException(status_code=404, detail=f"Portfolio with ID {portfolio_id} not found")
        
        # Get latest risk analysis
        analysis = db.query(models.RiskAnalysis).filter(
            models.RiskAnalysis.portfolio_id == portfolio_id
        ).order_by(models.RiskAnalysis.analysis_date.desc()).first()
        
        if analysis is None:
            continue
        
        result[str(portfolio_id)] = {
            "portfolio_name": portfolio.name,
            "risk_score": analysis.risk_score,
            "volatility": analysis.volatility,
            "sharpe_ratio": analysis.sharpe_ratio,
            "var_95": analysis.var_95,
            "analysis_date": analysis.analysis_date
        }
    
    if not result:
        raise HTTPException(status_code=404, detail="No risk analyses found for the specified portfolios")
    
    return result