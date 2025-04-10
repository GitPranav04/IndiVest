import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Alert,
} from '@mui/material';
import axios from 'axios';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Import market data service
import { marketDataService } from '../services/marketData';

// Get API keys from environment variables
const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const TWELVE_DATA_API_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY;
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;

// Default data in case API calls fail
const defaultIndices = [
  { id: 1, name: 'Nifty 50', value: 19345.65, change: 145.23, changePercent: 0.75, color: 'success.main' },
  { id: 2, name: 'Sensex', value: 64718.56, change: 436.82, changePercent: 0.68, color: 'success.main' },
  { id: 3, name: 'Bank Nifty', value: 43567.89, change: 398.45, changePercent: 0.92, color: 'success.main' },
  { id: 4, name: 'Nifty IT', value: 31245.67, change: -156.78, changePercent: -0.50, color: 'error.main' },
];

const defaultTopGainers = [
  { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', price: 145.75, change: 12.45, changePercent: 9.34 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Ltd.', price: 567.30, change: 34.20, changePercent: 6.42 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Ltd.', price: 789.55, change: 43.25, changePercent: 5.80 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd.', price: 890.15, change: 42.35, changePercent: 5.00 },
  { symbol: 'SBIN', name: 'State Bank of India', price: 567.85, change: 23.45, changePercent: 4.31 },
];

const defaultTopLosers = [
  { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', price: 1245.60, change: -65.30, changePercent: -4.98 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', price: 1156.75, change: -45.25, changePercent: -3.76 },
  { symbol: 'WIPRO', name: 'Wipro Ltd.', price: 432.50, change: -15.75, changePercent: -3.52 },
  { symbol: 'INFY', name: 'Infosys Ltd.', price: 1478.90, change: -45.10, changePercent: -2.96 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', price: 3456.25, change: -87.75, changePercent: -2.48 },
];

const defaultStockData = [
  { date: '2023-01', value: 19245.65 },
  { date: '2023-02', value: 19567.32 },
  { date: '2023-03', value: 19876.54 },
  { date: '2023-04', value: 20123.45 },
  { date: '2023-05', value: 19876.32 },
  { date: '2023-06', value: 20345.67 },
  { date: '2023-07', value: 20567.89 },
  { date: '2023-08', value: 20789.54 },
  { date: '2023-09', value: 20456.78 },
  { date: '2023-10', value: 20678.90 },
  { date: '2023-11', value: 21234.56 },
  { date: '2023-12', value: 21567.89 },
];

function MarketData() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stockResults, setStockResults] = useState([]);
  
  // State for real-time data
  const [indices, setIndices] = useState(defaultIndices);
  const [topGainers, setTopGainers] = useState(defaultTopGainers);
  const [topLosers, setTopLosers] = useState(defaultTopLosers);
  const [stockData, setStockData] = useState(defaultStockData);
  
  // Fetch market data on component mount
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Validate API keys
        if (!ALPHA_VANTAGE_API_KEY || !TWELVE_DATA_API_KEY || !FMP_API_KEY || 
            ALPHA_VANTAGE_API_KEY === 'demo' || TWELVE_DATA_API_KEY === 'demo' || FMP_API_KEY === 'demo') {
          throw new Error('Valid API keys are required for market data');
        }

        // Fetch indices data
        let updatedIndices = [...defaultIndices];
        try {
          const [nifty, sensex, bankNifty, niftyIT] = await Promise.all([
            marketDataService.getStockPrice('NIFTY50'),
            marketDataService.getStockPrice('SENSEX'),
            marketDataService.getStockPrice('BANKNIFTY'),
            marketDataService.getStockPrice('NIFTYIT')
          ]);

          // Only update if we have valid data
          if (nifty && nifty['05. price']) {
            updatedIndices[0] = {
              id: 1,
              name: 'Nifty 50',
              value: parseFloat(nifty['05. price']),
              change: parseFloat(nifty['09. change']),
              changePercent: parseFloat(nifty['10. change percent']?.replace('%', '')),
              color: parseFloat(nifty['09. change']) >= 0 ? 'success.main' : 'error.main'
            };
          }

          if (sensex && sensex['05. price']) {
            updatedIndices[1] = {
              id: 2,
              name: 'Sensex',
              value: parseFloat(sensex['05. price']),
              change: parseFloat(sensex['09. change']),
              changePercent: parseFloat(sensex['10. change percent']?.replace('%', '')),
              color: parseFloat(sensex['09. change']) >= 0 ? 'success.main' : 'error.main'
            };
          }

          if (bankNifty && bankNifty['05. price']) {
            updatedIndices[2] = {
              id: 3,
              name: 'Bank Nifty',
              value: parseFloat(bankNifty['05. price']),
              change: parseFloat(bankNifty['09. change']),
              changePercent: parseFloat(bankNifty['10. change percent']?.replace('%', '')),
              color: parseFloat(bankNifty['09. change']) >= 0 ? 'success.main' : 'error.main'
            };
          }

          if (niftyIT && niftyIT['05. price']) {
            updatedIndices[3] = {
              id: 4,
              name: 'Nifty IT',
              value: parseFloat(niftyIT['05. price']),
              change: parseFloat(niftyIT['09. change']),
              changePercent: parseFloat(niftyIT['10. change percent']?.replace('%', '')),
              color: parseFloat(niftyIT['09. change']) >= 0 ? 'success.main' : 'error.main'
            };
          }
        } catch (err) {
          console.error('Error fetching indices:', err);
          setError(prev => prev + '\nFailed to fetch live indices data.');
        }
        
        setIndices(updatedIndices);
        
        // Fetch top gainers and losers
        try {
          const gainersLosersResponse = await axios.get(
            `https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${FMP_API_KEY}`
          );
          
          if (gainersLosersResponse.data && Array.isArray(gainersLosersResponse.data)) {
            const stocks = gainersLosersResponse.data;
            
            // Process top gainers
            const gainers = stocks
              .filter(stock => stock.changesPercentage > 0)
              .slice(0, 5)
              .map(stock => ({
                symbol: stock.symbol,
                name: stock.name,
                price: stock.price,
                change: stock.change,
                changePercent: stock.changesPercentage
              }));
              
            if (gainers.length > 0) {
              setTopGainers(gainers);
            }
            
            // Process top losers
            const losers = stocks
              .filter(stock => stock.changesPercentage < 0)
              .slice(0, 5)
              .map(stock => ({
                symbol: stock.symbol,
                name: stock.name,
                price: stock.price,
                change: stock.change,
                changePercent: stock.changesPercentage
              }));
              
            if (losers.length > 0) {
              setTopLosers(losers);
            }
          }
        } catch (err) {
          console.error('Error fetching gainers/losers:', err);
          setError(prev => prev + '\nFailed to fetch top gainers and losers data.');
        }
        
        // Fetch historical data for Nifty 50
        try {
          const historicalDataResponse = await axios.get(
            `https://api.twelvedata.com/time_series?symbol=NIFTY50&interval=1month&outputsize=12&apikey=${TWELVE_DATA_API_KEY}`
          );
          
          if (historicalDataResponse.data?.values?.length > 0) {
            const chartData = historicalDataResponse.data.values
              .map(item => ({
                date: item.datetime.substring(0, 7),
                value: parseFloat(item.close)
              }))
              .reverse();
            
            setStockData(chartData);
          }
        } catch (err) {
          console.error('Error fetching historical data:', err);
          setError(prev => prev + '\nFailed to fetch historical data.');
        }
      } catch (err) {
        console.error('Error in market data fetch:', err);
        setError('Failed to load market data. Some data may be using default values.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarketData();
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      setLoading(true);
      // In a real app, this would be an API call
      setTimeout(() => {
        // Simulate API response
        setStockResults([
          { symbol: searchQuery.toUpperCase(), name: `${searchQuery.toUpperCase()} Corp.`, price: 1245.60, change: 65.30, changePercent: 4.98 },
        ]);
        setLoading(false);
      }, 1000);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Market Data
      </Typography>

      {/* Market Indices */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {indices.map((index) => (
          <Grid item xs={12} sm={6} md={3} key={index.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {index.name}
                </Typography>
                <Typography variant="h4" component="div">
                  {index.value.toLocaleString('en-IN')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {index.change > 0 ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
                  <Typography variant="body2" color={index.color} sx={{ ml: 1 }}>
                    {index.change > 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            placeholder="Search for stocks (e.g., RELIANCE, INFY, TCS)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit" edge="end">
                    {loading ? <CircularProgress size={24} /> : <SearchIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </form>

        {stockResults.length > 0 && (
          <TableContainer 
            component={Paper} 
            sx={{ 
              mt: 2,
              position: 'absolute',
              width: 'calc(100% - 32px)',
              zIndex: 9999,
              boxShadow: 3,
              maxHeight: '400px',
              overflowY: 'auto',
              bgcolor: 'background.paper'
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Change</TableCell>
                  <TableCell align="right">% Change</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockResults.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell component="th" scope="row">
                      <Typography variant="body2" fontWeight="bold">
                        {stock.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell align="right">₹{stock.price.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: stock.change >= 0 ? 'success.main' : 'error.main' }}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: stock.changePercent >= 0 ? 'success.main' : 'error.main' }}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Top Gainers & Losers */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Top Gainers" />
          <Tab label="Top Losers" />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Change</TableCell>
                <TableCell align="right">% Change</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(tabValue === 0 ? topGainers : topLosers).map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="bold">
                      {stock.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell align="right">₹{stock.price.toFixed(2)}</TableCell>
                  <TableCell align="right" sx={{ color: stock.change >= 0 ? 'success.main' : 'error.main' }}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: stock.changePercent >= 0 ? 'success.main' : 'error.main' }}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Market Trend Chart */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Nifty 50 - 12 Month Trend
        </Typography>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={stockData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#1976d2" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}

export default MarketData;