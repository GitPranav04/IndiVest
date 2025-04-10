from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import local modules
from .database import engine, get_db
from .models import models, schemas, users
from .auth import auth
from .routers import portfolio, market_data, risk_analysis, sentiment_analysis

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="IndiVest API",
    description="Portfolio Management API for Indian Market",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
app.include_router(market_data.router, prefix="/market", tags=["Market Data"])
app.include_router(risk_analysis.router, prefix="/risk", tags=["Risk Analysis"])
app.include_router(sentiment_analysis.router, prefix="/sentiment", tags=["Sentiment Analysis"])


@app.get("/", tags=["Root"])
async def root():
    return {"message": "Welcome to IndiVest API - Portfolio Management for Indian Market"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)