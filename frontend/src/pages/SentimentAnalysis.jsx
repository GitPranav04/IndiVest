import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Button,
  Tab,
  Tabs,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import { styled } from '@mui/material/styles';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Sample data - in a real app, this would come from API
const samplePortfolios = [
  { id: 1, name: 'Main Portfolio' },
  { id: 2, name: 'Retirement Fund' },
];

const sampleStocks = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.' },
  { symbol: 'INFY', name: 'Infosys Ltd.' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.' },
];

const sampleSentimentOverview = {
  overallSentiment: 65, // 0-100 scale, higher is more positive
  positiveCount: 28,
  neutralCount: 12,
  negativeCount: 10,
  sentimentChange: 5, // change from previous period
};

const sampleSentimentTrend = [
  { date: '2023-06', sentiment: 58 },
  { date: '2023-07', sentiment: 62 },
  { date: '2023-08', sentiment: 55 },
  { date: '2023-09', sentiment: 60 },
  { date: '2023-10', sentiment: 63 },
  { date: '2023-11', sentiment: 65 },
];

const sampleStockSentiment = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sentiment: 75, change: 8, newsCount: 15 },
  { symbol: 'INFY', name: 'Infosys Ltd.', sentiment: 62, change: -3, newsCount: 12 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sentiment: 70, change: 5, newsCount: 10 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', sentiment: 68, change: 2, newsCount: 8 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', sentiment: 55, change: -5, newsCount: 5 },
];

const sampleNewsSentiment = [
  { 
    id: 1, 
    title: 'Reliance Industries announces new green energy initiative', 
    source: 'Economic Times', 
    date: '2023-11-15', 
    sentiment: 'positive',
    score: 0.85,
    snippet: 'Reliance Industries has announced a major new green energy initiative with an investment of ₹75,000 crore over the next 5 years...'
  },
  { 
    id: 2, 
    title: 'Infosys reports lower than expected quarterly results', 
    source: 'Business Standard', 
    date: '2023-11-12', 
    sentiment: 'negative',
    score: 0.32,
    snippet: 'Infosys reported quarterly results below market expectations, citing challenges in the banking and financial services sector...'
  },
  { 
    id: 3, 
    title: 'HDFC Bank completes merger process, becomes larger entity', 
    source: 'Mint', 
    date: '2023-11-10', 
    sentiment: 'positive',
    score: 0.78,
    snippet: 'HDFC Bank has successfully completed its merger with HDFC Ltd, creating one of the largest banks in the country with a combined asset base...'
  },
  { 
    id: 4, 
    title: 'TCS signs new deal with European financial services firm', 
    source: 'Financial Express', 
    date: '2023-11-08', 
    sentiment: 'positive',
    score: 0.72,
    snippet: 'Tata Consultancy Services has signed a new multi-year, multi-million dollar deal with a leading European financial services company...'
  },
  { 
    id: 5, 
    title: 'Market remains neutral on ICICI Bank despite strong fundamentals', 
    source: 'CNBC-TV18', 
    date: '2023-11-05', 
    sentiment: 'neutral',
    score: 0.51,
    snippet: 'Despite strong fundamentals and consistent performance, market sentiment remains neutral on ICICI Bank as investors await clarity on...'
  },
];

const sampleSocialMediaSentiment = [
  { 
    id: 1, 
    platform: 'Twitter', 
    user: 'MarketAnalyst', 
    date: '2023-11-15', 
    sentiment: 'positive',
    score: 0.75,
    content: 'Reliance Industries continues to impress with its strategic investments in green energy. Long term outlook remains strong. #Reliance #Stocks'
  },
  { 
    id: 2, 
    platform: 'Reddit', 
    user: 'investor_prime', 
    date: '2023-11-14', 
    sentiment: 'negative',
    score: 0.25,
    content: 'Concerned about Infosys exposure to banking sector. Their guidance seems overly optimistic given current market conditions.'
  },
  { 
    id: 3, 
    platform: 'Twitter', 
    user: 'FinanceGuru', 
    date: '2023-11-13', 
    sentiment: 'positive',
    score: 0.82,
    content: 'HDFC Bank merger creates a banking powerhouse. Expect significant synergies and market share gains in the coming quarters. #HDFCBank'
  },
  { 
    id: 4, 
    platform: 'Stocktwits', 
    user: 'tech_investor', 
    date: '2023-11-12', 
    sentiment: 'neutral',
    score: 0.48,
    content: 'TCS deal pipeline looks decent but pricing pressure remains a concern. Watching closely for next quarter guidance.'
  },
  { 
    id: 5, 
    platform: 'Twitter', 
    user: 'BankingSector', 
    date: '2023-11-10', 
    sentiment: 'positive',
    score: 0.65,
    content: 'ICICI Bank\'s digital initiatives are paying off. Customer acquisition costs down, retention up. Good long term play. #ICICIBank #DigitalBanking'
  },
];

const SENTIMENT_COLORS = {
  positive: '#4caf50',
  neutral: '#ff9800',
  negative: '#f44336',
};

const SENTIMENT_ICONS = {
  positive: <SentimentSatisfiedAltIcon />,
  neutral: <SentimentNeutralIcon />,
  negative: <SentimentDissatisfiedIcon />,
};

const StyledSentimentChip = styled(Chip)(({ theme, sentimentType }) => ({
  backgroundColor: SENTIMENT_COLORS[sentimentType],
  color: theme.palette.getContrastText(SENTIMENT_COLORS[sentimentType]),
}));

function getSentimentType(score) {
  if (score >= 0.6) return 'positive';
  if (score <= 0.4) return 'negative';
  return 'neutral';
}

function getSentimentColor(score) {
  return SENTIMENT_COLORS[getSentimentType(score)];
}

function SentimentAnalysis() {
  const [selectedPortfolio, setSelectedPortfolio] = useState(1);
  const [selectedStock, setSelectedStock] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    // Simulate API loading when portfolio changes
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedPortfolio, selectedStock]);

  const handlePortfolioChange = (event) => {
    setSelectedPortfolio(event.target.value);
  };

  const handleStockChange = (event) => {
    setSelectedStock(event.target.value);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      setLoading(true);
      // In a real app, this would be an API call
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Sentiment Analysis
      </Typography>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Portfolio</InputLabel>
              <Select
                value={selectedPortfolio}
                label="Portfolio"
                onChange={handlePortfolioChange}
              >
                {samplePortfolios.map((portfolio) => (
                  <MenuItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Stock (Optional)</InputLabel>
              <Select
                value={selectedStock}
                label="Stock (Optional)"
                onChange={handleStockChange}
                displayEmpty
              >
                <MenuItem value="">All Stocks</MenuItem>
                {sampleStocks.map((stock) => (
                  <MenuItem key={stock.symbol} value={stock.symbol}>
                    {stock.symbol} - {stock.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <form onSubmit={handleSearch}>
              <TextField
                fullWidth
                placeholder="Search news and social media"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton type="submit" edge="end">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </form>
          </Grid>
        </Grid>
      </Paper>

      {/* Sentiment Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Sentiment
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                <CircularProgress
                  variant="determinate"
                  value={sampleSentimentOverview.overallSentiment}
                  size={120}
                  thickness={5}
                  sx={{
                    color: getSentimentColor(sampleSentimentOverview.overallSentiment / 100),
                    mb: 2,
                  }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" component="div">
                    {sampleSentimentOverview.overallSentiment}%
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                {sampleSentimentOverview.sentimentChange > 0 ? (
                  <TrendingUpIcon color="success" />
                ) : (
                  <TrendingDownIcon color="error" />
                )}
                <Typography
                  variant="body1"
                  color={sampleSentimentOverview.sentimentChange >= 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 1 }}
                >
                  {sampleSentimentOverview.sentimentChange >= 0 ? '+' : ''}
                  {sampleSentimentOverview.sentimentChange}% from last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sentiment Distribution
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Positive', value: sampleSentimentOverview.positiveCount },
                        { name: 'Neutral', value: sampleSentimentOverview.neutralCount },
                        { name: 'Negative', value: sampleSentimentOverview.negativeCount },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell key="cell-positive" fill={SENTIMENT_COLORS.positive} />
                      <Cell key="cell-neutral" fill={SENTIMENT_COLORS.neutral} />
                      <Cell key="cell-negative" fill={SENTIMENT_COLORS.negative} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Positive
                  </Typography>
                  <Typography variant="h6">{sampleSentimentOverview.positiveCount}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Neutral
                  </Typography>
                  <Typography variant="h6">{sampleSentimentOverview.neutralCount}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Negative
                  </Typography>
                  <Typography variant="h6">{sampleSentimentOverview.negativeCount}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sentiment Trend
              </Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={sampleSentimentTrend}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Line
                      type="monotone"
                      dataKey="sentiment"
                      stroke="#1976d2"
                      activeDot={{ r: 8 }}
                      name="Sentiment Score"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stock Sentiment */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Stock Sentiment Analysis
        </Typography>
        <Grid container spacing={3}>
          {sampleStockSentiment.map((stock) => (
            <Grid item xs={12} sm={6} md={4} key={stock.symbol}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {stock.symbol}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {stock.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" sx={{ mr: 1 }}>
                      Sentiment Score:
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{ color: getSentimentColor(stock.sentiment / 100) }}
                    >
                      {stock.sentiment}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {stock.change > 0 ? (
                      <TrendingUpIcon fontSize="small" color="success" />
                    ) : (
                      <TrendingDownIcon fontSize="small" color="error" />
                    )}
                    <Typography
                      variant="body2"
                      color={stock.change >= 0 ? 'success.main' : 'error.main'}
                      sx={{ ml: 0.5 }}
                    >
                      {stock.change >= 0 ? '+' : ''}
                      {stock.change}% from last period
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Based on {stock.newsCount} news articles and social media posts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* News and Social Media Sentiment */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="sentiment tabs">
            <Tab label="News Articles" />
            <Tab label="Social Media" />
          </Tabs>
        </Box>

        {/* News Articles Tab */}
        {tabValue === 0 && (
          <List>
            {sampleNewsSentiment.map((news) => (
              <React.Fragment key={news.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" component="div">
                          {news.title}
                        </Typography>
                        <StyledSentimentChip
                          icon={SENTIMENT_ICONS[news.sentiment]}
                          label={`${(news.score * 100).toFixed(0)}%`}
                          size="small"
                          sentimentType={news.sentiment}
                        />
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          sx={{ display: 'block' }}
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {news.source} • {news.date}
                        </Typography>
                        <Typography
                          sx={{ display: 'block', mt: 1 }}
                          component="span"
                          variant="body2"
                        >
                          {news.snippet}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Social Media Tab */}
        {tabValue === 1 && (
          <List>
            {sampleSocialMediaSentiment.map((post) => (
              <React.Fragment key={post.id}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" component="div">
                          {post.user} on {post.platform}
                        </Typography>
                        <StyledSentimentChip
                          icon={SENTIMENT_ICONS[post.sentiment]}
                          label={`${(post.score * 100).toFixed(0)}%`}
                          size="small"
                          sentimentType={post.sentiment}
                        />
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          sx={{ display: 'block' }}
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {post.date}
                        </Typography>
                        <Typography
                          sx={{ display: 'block', mt: 1 }}
                          component="span"
                          variant="body2"
                        >
                          {post.content}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="contained">
            Load More
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default SentimentAnalysis;