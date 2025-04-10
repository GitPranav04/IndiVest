import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Sample data - in a real app, this would come from API
const samplePortfolios = [
  { id: 1, name: 'Main Portfolio', description: 'Long-term investment portfolio', totalValue: 1250000, change: 45000, changePercent: 3.75 },
  { id: 2, name: 'Retirement Fund', description: 'Retirement savings', totalValue: 750000, change: 25000, changePercent: 3.45 },
];

const sampleHoldings = [
  { id: 1, symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', quantity: 100, avgBuyPrice: 2500, currentPrice: 2625, value: 262500, change: 12500, changePercent: 5.0 },
  { id: 2, symbol: 'INFY', name: 'Infosys Ltd.', quantity: 150, avgBuyPrice: 1600, currentPrice: 1570, value: 235500, change: -4500, changePercent: -1.88 },
  { id: 3, symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', quantity: 80, avgBuyPrice: 1650, currentPrice: 1690, value: 135200, change: 3200, changePercent: 2.42 },
  { id: 4, symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', quantity: 40, avgBuyPrice: 3400, currentPrice: 3420, value: 136800, change: 800, changePercent: 0.59 },
  { id: 5, symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', quantity: 120, avgBuyPrice: 900, currentPrice: 930, value: 111600, change: 3600, changePercent: 3.33 },
];

const sampleTransactions = [
  { id: 1, date: '2023-11-15', symbol: 'RELIANCE', type: 'BUY', quantity: 10, price: 2500, total: 25000 },
  { id: 2, date: '2023-11-12', symbol: 'INFY', type: 'SELL', quantity: 15, price: 1600, total: 24000 },
  { id: 3, date: '2023-11-10', symbol: 'HDFCBANK', type: 'BUY', quantity: 5, price: 1650, total: 8250 },
  { id: 4, date: '2023-11-05', symbol: 'TCS', type: 'BUY', quantity: 8, price: 3400, total: 27200 },
  { id: 5, date: '2023-10-28', symbol: 'ICICIBANK', type: 'BUY', quantity: 20, price: 900, total: 18000 },
];

const sampleSectorAllocation = [
  { name: 'IT', value: 35 },
  { name: 'Banking', value: 25 },
  { name: 'Oil & Gas', value: 20 },
  { name: 'Pharma', value: 10 },
  { name: 'Auto', value: 10 },
];

const samplePerformanceData = [
  { month: 'Jan', value: 1000000 },
  { month: 'Feb', value: 1050000 },
  { month: 'Mar', value: 1030000 },
  { month: 'Apr', value: 1080000 },
  { month: 'May', value: 1100000 },
  { month: 'Jun', value: 1150000 },
  { month: 'Jul', value: 1200000 },
  { month: 'Aug', value: 1250000 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// API keys - in a real app, these would be stored in environment variables
const ALPHA_VANTAGE_API_KEY = 'demo';
const TWELVE_DATA_API_KEY = 'demo';
const FMP_API_KEY = 'demo';

function Portfolio() {
  const { currentUser } = useAuth();
  const [selectedPortfolio, setSelectedPortfolio] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [openAddHolding, setOpenAddHolding] = useState(false);
  const [openAddTransaction, setOpenAddTransaction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for real-time data
  const [portfolios, setPortfolios] = useState(samplePortfolios);
  const [holdings, setHoldings] = useState(sampleHoldings);
  const [transactions, setTransactions] = useState(sampleTransactions);
  const [sectorAllocation, setSectorAllocation] = useState(sampleSectorAllocation);
  const [performanceData, setPerformanceData] = useState(samplePerformanceData);
  
  // Fetch portfolio data on component mount
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // In a real app, these would be API calls to your backend
        // For demo purposes, we'll simulate API calls with timeouts
        
        // Fetch user portfolios
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Update real-time stock prices for holdings
          const symbols = sampleHoldings.map(h => h.symbol).join(',');
          const stockPricesResponse = await axios.get(
            `https://api.twelvedata.com/price?symbol=${symbols}&apikey=${TWELVE_DATA_API_KEY}`
          );
          
          if (stockPricesResponse.data) {
            // Update holdings with real-time prices
            const updatedHoldings = sampleHoldings.map(holding => {
              const currentPrice = parseFloat(stockPricesResponse.data[holding.symbol]?.price || holding.currentPrice);
              const value = currentPrice * holding.quantity;
              const change = value - (holding.avgBuyPrice * holding.quantity);
              const changePercent = (change / (holding.avgBuyPrice * holding.quantity)) * 100;
              
              return {
                ...holding,
                currentPrice,
                value,
                change,
                changePercent
              };
            });
            
            setHoldings(updatedHoldings);
            
            // Calculate total portfolio value
            const totalValue = updatedHoldings.reduce((sum, h) => sum + h.value, 0);
            const originalValue = updatedHoldings.reduce((sum, h) => sum + (h.avgBuyPrice * h.quantity), 0);
            const totalChange = totalValue - originalValue;
            const totalChangePercent = (totalChange / originalValue) * 100;
            
            // Update portfolios with new values
            setPortfolios([
              {
                ...samplePortfolios[0],
                totalValue,
                change: totalChange,
                changePercent: totalChangePercent
              },
              ...samplePortfolios.slice(1)
            ]);
          }
        } catch (err) {
          console.error('Error fetching portfolio data:', err);
          // Keep using sample data if API calls fail
        }
      } catch (err) {
        console.error('Error in portfolio data fetching:', err);
        setError('Failed to load portfolio data. Using default values instead.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolioData();
  }, []);

  // Form states
  const [newHolding, setNewHolding] = useState({
    symbol: '',
    quantity: '',
    avgBuyPrice: '',
  });

  const [newTransaction, setNewTransaction] = useState({
    symbol: '',
    type: 'BUY',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handlePortfolioChange = (portfolioId) => {
    setSelectedPortfolio(portfolioId);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddHoldingOpen = () => {
    setOpenAddHolding(true);
  };

  const handleAddHoldingClose = () => {
    setOpenAddHolding(false);
    setNewHolding({ symbol: '', quantity: '', avgBuyPrice: '' });
  };

  const handleAddTransactionOpen = () => {
    setOpenAddTransaction(true);
  };

  const handleAddTransactionClose = () => {
    setOpenAddTransaction(false);
    setNewTransaction({
      symbol: '',
      type: 'BUY',
      quantity: '',
      price: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleHoldingChange = (e) => {
    const { name, value } = e.target;
    setNewHolding({ ...newHolding, [name]: value });
  };

  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction({ ...newTransaction, [name]: value });
  };

  const handleAddHolding = () => {
    // In a real app, this would be an API call
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      handleAddHoldingClose();
      // Would update state with new holding
    }, 1000);
  };

  const handleAddTransaction = () => {
    // In a real app, this would be an API call
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      handleAddTransactionClose();
      // Would update state with new transaction
    }, 1000);
  };

  const currentPortfolio = samplePortfolios.find((p) => p.id === selectedPortfolio);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Portfolio Management
      </Typography>

      {/* Portfolio Selection */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {samplePortfolios.map((portfolio) => (
          <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: portfolio.id === selectedPortfolio ? '2px solid #1976d2' : 'none',
              }}
              onClick={() => handlePortfolioChange(portfolio.id)}
            >
              <CardContent>
                <Typography variant="h6" component="div">
                  {portfolio.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {portfolio.description}
                </Typography>
                <Typography variant="h5" component="div">
                  ₹{portfolio.totalValue.toLocaleString('en-IN')}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography
                    variant="body2"
                    color={portfolio.change >= 0 ? 'success.main' : 'error.main'}
                  >
                    {portfolio.change >= 0 ? '+' : ''}
                    ₹{portfolio.change.toLocaleString('en-IN')} ({portfolio.changePercent.toFixed(2)}%)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px dashed #ccc',
              cursor: 'pointer',
            }}
          >
            <CardContent>
              <Box sx={{ textAlign: 'center' }}>
                <AddIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                <Typography variant="body1" color="text.secondary">
                  Create New Portfolio
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {currentPortfolio && (
        <>
          {/* Portfolio Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="Holdings" />
              <Tab label="Transactions" />
              <Tab label="Analytics" />
            </Tabs>
          </Paper>

          {/* Holdings Tab */}
          {tabValue === 0 && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Holdings</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddHoldingOpen}
                >
                  Add Holding
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Avg. Buy Price</TableCell>
                      <TableCell align="right">Current Price</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">P&L</TableCell>
                      <TableCell align="right">% Change</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sampleHoldings.map((holding) => (
                      <TableRow key={holding.id}>
                        <TableCell component="th" scope="row">
                          <Typography variant="body2" fontWeight="bold">
                            {holding.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell>{holding.name}</TableCell>
                        <TableCell align="right">{holding.quantity}</TableCell>
                        <TableCell align="right">₹{holding.avgBuyPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{holding.currentPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{holding.value.toLocaleString('en-IN')}</TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: holding.change >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {holding.change >= 0 ? '+' : ''}
                          ₹{holding.change.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ color: holding.changePercent >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {holding.changePercent >= 0 ? '+' : ''}
                          {holding.changePercent.toFixed(2)}%
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Transactions Tab */}
          {tabValue === 1 && (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Transactions</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddTransactionOpen}
                >
                  Add Transaction
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Symbol</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sampleTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell component="th" scope="row">
                          <Typography variant="body2" fontWeight="bold">
                            {transaction.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.type}
                            color={transaction.type === 'BUY' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{transaction.quantity}</TableCell>
                        <TableCell align="right">₹{transaction.price.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{transaction.total.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Analytics Tab */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Sector Allocation
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sampleSectorAllocation}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {sampleSectorAllocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Portfolio Performance
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={samplePerformanceData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#1976d2"
                          activeDot={{ r: 8 }}
                          name="Portfolio Value"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </>
      )}

      {/* Add Holding Dialog */}
      <Dialog open={openAddHolding} onClose={handleAddHoldingClose}>
        <DialogTitle>Add New Holding</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the details of the stock you want to add to your portfolio.
          </DialogContentText>
          <TextField
            margin="dense"
            name="symbol"
            label="Stock Symbol"
            fullWidth
            variant="outlined"
            value={newHolding.symbol}
            onChange={handleHoldingChange}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            name="quantity"
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={newHolding.quantity}
            onChange={handleHoldingChange}
          />
          <TextField
            margin="dense"
            name="avgBuyPrice"
            label="Average Buy Price"
            type="number"
            fullWidth
            variant="outlined"
            value={newHolding.avgBuyPrice}
            onChange={handleHoldingChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddHoldingClose}>Cancel</Button>
          <Button
            onClick={handleAddHolding}
            variant="contained"
            disabled={loading || !newHolding.symbol || !newHolding.quantity || !newHolding.avgBuyPrice}
          >
            {loading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={openAddTransaction} onClose={handleAddTransactionClose}>
        <DialogTitle>Add New Transaction</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the details of the transaction you want to add to your portfolio.
          </DialogContentText>
          <TextField
            margin="dense"
            name="symbol"
            label="Stock Symbol"
            fullWidth
            variant="outlined"
            value={newTransaction.symbol}
            onChange={handleTransactionChange}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            name="type"
            label="Transaction Type"
            select
            fullWidth
            variant="outlined"
            value={newTransaction.type}
            onChange={handleTransactionChange}
          >
            <MenuItem value="BUY">Buy</MenuItem>
            <MenuItem value="SELL">Sell</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            name="quantity"
            label="Quantity"
            type="number"
            fullWidth
            variant="outlined"
            value={newTransaction.quantity}
            onChange={handleTransactionChange}
          />
          <TextField
            margin="dense"
            name="price"
            label="Price per Share"
            type="number"
            fullWidth
            variant="outlined"
            value={newTransaction.price}
            onChange={handleTransactionChange}
          />
          <TextField
            margin="dense"
            name="date"
            label="Transaction Date"
            type="date"
            fullWidth
            variant="outlined"
            value={newTransaction.date}
            onChange={handleTransactionChange}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddTransactionClose}>Cancel</Button>
          <Button
            onClick={handleAddTransaction}
            variant="contained"
            disabled={
              loading ||
              !newTransaction.symbol ||
              !newTransaction.quantity ||
              !newTransaction.price ||
              !newTransaction.date
            }
          >
            {loading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Portfolio;