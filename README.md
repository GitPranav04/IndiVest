# IndiVest - Indian Market Portfolio Management System

## Overview
IndiVest is a comprehensive portfolio management system designed specifically for the Indian market. It provides tools for tracking investments, analyzing risk using machine learning models, and performing sentiment analysis on market news using natural language processing.

## Features
- **User Authentication**: Secure login and registration system
- **Portfolio Tracking**: Monitor your investments in Indian stocks, mutual funds, and other securities
- **Risk Analysis**: ML-powered risk assessment of your portfolio
- **Sentiment Analysis**: NLP-based analysis of market news and social media to gauge market sentiment
- **Interactive Dashboards**: Visualize your portfolio performance and market trends
- **Indian Market Focus**: Tailored specifically for Indian market securities and regulations

## Tech Stack
- **Frontend**: React.js with modern UI components
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **ML/NLP**: Value at Risk(VaR), NLTK(Finbert)
- **Deployment**: Vercel

## Project Structure
```
IndiVest/
├── frontend/            # React frontend application
├── backend/             # FastAPI backend application
│   ├── app/             # Main application code
│   ├── models/          # ML and NLP models
│   └── tests/           # Backend tests
├── data/                # Data processing scripts and sample data
└── docs/                # Documentation
```

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # On Windows
source venv/bin/activate  # On Unix/MacOS
pip install -r requirements.txt
python -m app.main
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Deployment
The application is configured for deployment on Render with appropriate configuration files included in the repository.
