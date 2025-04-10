import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import dashboardService from '../services/dashboardService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
}));

// Sample data for dashboard
const samplePortfolioValue = {
  total: 1250000,
  change: 15000,
  changePercent: 1.2
};

const sampleIndices = [
  { id: 1, name: 'Nifty 50', value: 22450.75, change: 125.50, changePercent: 0.56, color: 'success.main' },
  { id: 2, name: 'Sensex', value: 73850.25, change: 412.30, changePercent: 0.56, color: 'success.main' },
  { id: 3, name: 'Nifty Bank', value: 48250.60, change: -125.40, changePercent: -0.26, color: 'error.main' },
  { id: 4, name: 'Nifty IT', value: 32150.80, change: 225.60, changePercent: 0.71, color: 'success.main' }
];

const samplePortfolioAllocation = [
  { name: 'Equity', value: 65 },
  { name: 'Debt', value: 20 },
  { name: 'Gold', value: 10 },
  { name: 'Cash', value: 5 }
];

const samplePerformanceData = [
  { month: 'Jan', value: 1050000 },
  { month: 'Feb', value: 1080000 },
  { month: 'Mar', value: 1120000 },
  { month: 'Apr', value: 1100000 },
  { month: 'May', value: 1150000 },
  { month: 'Jun', value: 1180000 },
  { month: 'Jul', value: 1210000 },
  { month: 'Aug', value: 1230000 },
  { month: 'Sep', value: 1200000 },
  { month: 'Oct', value: 1220000 },
  { month: 'Nov', value: 1240000 },
  { month: 'Dec', value: 1250000 }
];

const sampleTopHoldings = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', value: 125000, change: 1.5 },
  { symbol: 'INFY', name: 'Infosys Ltd.', value: 95000, change: 0.8 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', value: 85000, change: -0.5 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', value: 75000, change: 1.2 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', value: 65000, change: 0.7 }
];

const sampleRecentActivities = [
  { id: 1, type: 'BUY', symbol: 'RELIANCE', quantity: 10, price: 2500, date: '2023-06-15' },
  { id: 2, type: 'SELL', symbol: 'INFY', quantity: 15, price: 1800, date: '2023-06-10' },
  { id: 3, type: 'DIVIDEND', symbol: 'HDFCBANK', amount: 1500, date: '2023-06-05' },
  { id: 4, type: 'BUY', symbol: 'TCS', quantity: 5, price: 3200, date: '2023-06-01' },
  { id: 5, type: 'SELL', symbol: 'ICICIBANK', quantity: 20, price: 950, date: '2023-05-28' }
];

function Dashboard() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    portfolioValue: { total: 0, change: 0, changePercent: 0 },
    indices: [],
    portfolioAllocation: [],
    performanceData: [],
    topHoldings: [],
    recentActivities: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
        setError('');
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Using sample data instead.');
        // Use sample data as fallback when API fails
        setDashboardData({
          portfolioValue: samplePortfolioValue,
          indices: sampleIndices,
          portfolioAllocation: samplePortfolioAllocation,
          performanceData: samplePerformanceData,
          topHoldings: sampleTopHoldings,
          recentActivities: sampleRecentActivities,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

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
        Dashboard
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Portfolio Summary & Market Indices */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalanceWalletIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">Portfolio Value</Typography>
            </Box>
            <Typography variant="h3" component="div" gutterBottom>
              ₹{(dashboardData.portfolioValue?.total || samplePortfolioValue.total).toLocaleString('en-IN')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {(dashboardData.portfolioValue?.change || samplePortfolioValue.change) >= 0 ? (
                <TrendingUpIcon color="success" />
              ) : (
                <TrendingDownIcon color="error" />
              )}
              <Typography
                variant="body1"
                color={(dashboardData.portfolioValue?.change || samplePortfolioValue.change) >= 0 ? 'success.main' : 'error.main'}
                sx={{ ml: 1 }}
              >
                {(dashboardData.portfolioValue?.change || samplePortfolioValue.change) >= 0 ? '+' : ''}
                ₹{(dashboardData.portfolioValue?.change || samplePortfolioValue.change).toLocaleString('en-IN')} (
                {(dashboardData.portfolioValue?.changePercent || samplePortfolioValue.changePercent).toFixed(2)}%)
              </Typography>
            </Box>
            <Button variant="contained" sx={{ mt: 2 }} href="/portfolio">
              View Portfolio
            </Button>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShowChartIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">Market Indices</Typography>
            </Box>
            <Grid container spacing={2}>
              {(dashboardData.indices?.length > 0 ? dashboardData.indices : sampleIndices).map((index) => (
                <Grid item xs={12} sm={6} key={index.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">{index.name}</Typography>
                      <Typography variant="h5">{index.value.toLocaleString('en-IN')}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {index.change > 0 ? (
                          <TrendingUpIcon fontSize="small" color="success" />
                        ) : (
                          <TrendingDownIcon fontSize="small" color="error" />
                        )}
                        <Typography variant="body2" color={index.color} sx={{ ml: 0.5 }}>
                          {index.change > 0 ? '+' : ''}
                          {index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Button variant="outlined" sx={{ mt: 2 }} href="/market">
              View Market Data
            </Button>
          </StyledPaper>
        </Grid>
      </Grid>

      {/* Portfolio Allocation & Performance */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Portfolio Allocation
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.portfolioAllocation?.length > 0 ? dashboardData.portfolioAllocation : samplePortfolioAllocation}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {(dashboardData.portfolioAllocation?.length > 0 ? dashboardData.portfolioAllocation : samplePortfolioAllocation).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={7}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Portfolio Performance
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dashboardData.performanceData?.length > 0 ? dashboardData.performanceData : samplePerformanceData}
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
          </StyledPaper>
        </Grid>
      </Grid>

      {/* Top Holdings & Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Top Holdings
            </Typography>
            <List>
              {(dashboardData.topHoldings?.length > 0 ? dashboardData.topHoldings : sampleTopHoldings).map((holding) => (
                <React.Fragment key={holding.symbol}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>{holding.symbol.charAt(0)}</Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={holding.symbol}
                      secondary={holding.name}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1">
                        ₹{holding.value.toLocaleString('en-IN')}
                      </Typography>
                      <Typography
                        variant="body2"
                        color={holding.change >= 0 ? 'success.main' : 'error.main'}
                      >
                        {holding.change >= 0 ? '+' : ''}
                        {holding.change.toFixed(2)}%
                      </Typography>
                    </Box>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h6">Recent Activities</Typography>
            </Box>
            <List>
              {(dashboardData.recentActivities?.length > 0 ? dashboardData.recentActivities : sampleRecentActivities).map((activity) => (
                <React.Fragment key={activity.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor:
                            activity.type === 'BUY'
                              ? 'success.main'
                              : activity.type === 'SELL'
                              ? 'error.main'
                              : 'warning.main',
                        }}
                      >
                        {activity.type.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body1">
                          {activity.type === 'DIVIDEND'
                            ? `Received dividend of ₹${activity.amount}`
                            : `${activity.type} ${activity.quantity} shares of ${activity.symbol}`}
                        </Typography>
                      }
                      secondary={
                        activity.type !== 'DIVIDEND'
                          ? `Price: ₹${activity.price} | Date: ${activity.date}`
                          : `Date: ${activity.date}`
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;