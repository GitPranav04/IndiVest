import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Tooltip as MuiTooltip,
  Divider,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
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
  ScatterChart,
  Scatter,
  ZAxis,
  BarChart,
  Bar,
} from 'recharts';

// Sample data - in a real app, this would come from API
const samplePortfolios = [
  { id: 1, name: 'Main Portfolio' },
  { id: 2, name: 'Retirement Fund' },
];

const sampleRiskMetrics = {
  volatility: 15.8,
  beta: 1.2,
  alpha: 2.5,
  sharpeRatio: 1.8,
  treynorRatio: 10.5,
  maxDrawdown: 12.4,
  varDaily: 2.1,
  varWeekly: 4.5,
  varMonthly: 8.2,
};

const sampleVolatilityData = [
  { date: 'Jan', portfolio: 12.5, benchmark: 10.2 },
  { date: 'Feb', portfolio: 13.2, benchmark: 11.5 },
  { date: 'Mar', portfolio: 14.8, benchmark: 12.1 },
  { date: 'Apr', portfolio: 13.5, benchmark: 11.8 },
  { date: 'May', portfolio: 15.2, benchmark: 12.5 },
  { date: 'Jun', portfolio: 16.1, benchmark: 13.2 },
  { date: 'Jul', portfolio: 15.8, benchmark: 13.5 },
  { date: 'Aug', portfolio: 14.5, benchmark: 12.8 },
  { date: 'Sep', portfolio: 15.5, benchmark: 13.1 },
  { date: 'Oct', portfolio: 16.2, benchmark: 13.8 },
  { date: 'Nov', portfolio: 15.9, benchmark: 13.5 },
  { date: 'Dec', portfolio: 15.8, benchmark: 13.2 },
];

const sampleRiskReturnData = [
  { name: 'Portfolio', risk: 15.8, return: 18.5, size: 100 },
  { name: 'Nifty 50', risk: 13.2, return: 15.1, size: 100 },
  { name: 'IT Sector', risk: 18.5, return: 20.2, size: 100 },
  { name: 'Banking', risk: 16.2, return: 17.5, size: 100 },
  { name: 'Pharma', risk: 12.5, return: 13.8, size: 100 },
  { name: 'Auto', risk: 14.8, return: 16.2, size: 100 },
];

const sampleStockRiskData = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', beta: 0.95, volatility: 14.2, weight: 20 },
  { symbol: 'INFY', name: 'Infosys Ltd.', beta: 1.15, volatility: 16.8, weight: 15 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', beta: 1.05, volatility: 15.2, weight: 12 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', beta: 1.10, volatility: 16.5, weight: 10 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', beta: 1.25, volatility: 17.8, weight: 8 },
];

const sampleVaRData = [
  { confidence: '95%', daily: 2.1, weekly: 4.5, monthly: 8.2 },
  { confidence: '99%', daily: 3.2, weekly: 6.8, monthly: 12.5 },
];

const StyledInfoIcon = styled(InfoIcon)(({ theme }) => ({
  fontSize: '1rem',
  marginLeft: theme.spacing(0.5),
  color: theme.palette.text.secondary,
  cursor: 'help',
}));

function RiskAnalysis() {
  const [selectedPortfolio, setSelectedPortfolio] = useState(1);
  const [timeframe, setTimeframe] = useState('1Y');
  const [loading, setLoading] = useState(false);
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  useEffect(() => {
    // Simulate API loading when portfolio or timeframe changes
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedPortfolio, timeframe]);

  const handlePortfolioChange = (event) => {
    setSelectedPortfolio(event.target.value);
  };

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  const handleConfidenceChange = (event, newValue) => {
    setConfidenceLevel(newValue);
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
        Risk Analysis
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
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={timeframe}
                label="Timeframe"
                onChange={handleTimeframeChange}
              >
                <MenuItem value="1M">1 Month</MenuItem>
                <MenuItem value="3M">3 Months</MenuItem>
                <MenuItem value="6M">6 Months</MenuItem>
                <MenuItem value="1Y">1 Year</MenuItem>
                <MenuItem value="3Y">3 Years</MenuItem>
                <MenuItem value="5Y">5 Years</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="contained" fullWidth>
              Run Analysis
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Risk Metrics */}
      <Typography variant="h6" gutterBottom>
        Key Risk Metrics
      </Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1">Volatility (Annualized)</Typography>
                <MuiTooltip title="Measures the dispersion of returns for the portfolio">
                  <StyledInfoIcon />
                </MuiTooltip>
              </Box>
              <Typography variant="h4">{sampleRiskMetrics.volatility.toFixed(2)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1">Beta</Typography>
                <MuiTooltip title="Measures the volatility of the portfolio relative to the market">
                  <StyledInfoIcon />
                </MuiTooltip>
              </Box>
              <Typography variant="h4">{sampleRiskMetrics.beta.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1">Sharpe Ratio</Typography>
                <MuiTooltip title="Measures risk-adjusted return (higher is better)">
                  <StyledInfoIcon />
                </MuiTooltip>
              </Box>
              <Typography variant="h4">{sampleRiskMetrics.sharpeRatio.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1">Alpha</Typography>
                <MuiTooltip title="Excess return of the portfolio over the benchmark">
                  <StyledInfoIcon />
                </MuiTooltip>
              </Box>
              <Typography variant="h4">{sampleRiskMetrics.alpha.toFixed(2)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1">Maximum Drawdown</Typography>
                <MuiTooltip title="Maximum observed loss from a peak to a trough">
                  <StyledInfoIcon />
                </MuiTooltip>
              </Box>
              <Typography variant="h4">{sampleRiskMetrics.maxDrawdown.toFixed(2)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle1">Treynor Ratio</Typography>
                <MuiTooltip title="Measures excess return per unit of risk">
                  <StyledInfoIcon />
                </MuiTooltip>
              </Box>
              <Typography variant="h4">{sampleRiskMetrics.treynorRatio.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Volatility Chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Historical Volatility Comparison
        </Typography>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sampleVolatilityData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 'auto']} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="portfolio"
                stroke="#1976d2"
                activeDot={{ r: 8 }}
                name="Portfolio Volatility"
              />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#ff7300"
                activeDot={{ r: 8 }}
                name="Benchmark Volatility"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Risk-Return Scatter Plot */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Risk-Return Analysis
        </Typography>
        <Box sx={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="risk"
                name="Risk (Volatility %)"
                domain={['auto', 'auto']}
              />
              <YAxis
                type="number"
                dataKey="return"
                name="Return (%)"
                domain={['auto', 'auto']}
              />
              <ZAxis type="number" dataKey="size" range={[100, 100]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Scatter
                name="Risk-Return Profile"
                data={sampleRiskReturnData}
                fill="#1976d2"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Stock Risk Contribution */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Stock Risk Contribution
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Name</TableCell>
                <TableCell align="right">Beta</TableCell>
                <TableCell align="right">Volatility (%)</TableCell>
                <TableCell align="right">Weight (%)</TableCell>
                <TableCell align="right">Risk Contribution (%)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sampleStockRiskData.map((stock) => (
                <TableRow key={stock.symbol}>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="bold">
                      {stock.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>{stock.name}</TableCell>
                  <TableCell align="right">{stock.beta.toFixed(2)}</TableCell>
                  <TableCell align="right">{stock.volatility.toFixed(2)}%</TableCell>
                  <TableCell align="right">{stock.weight.toFixed(2)}%</TableCell>
                  <TableCell align="right">
                    {((stock.beta * stock.weight) / sampleStockRiskData.reduce((sum, s) => sum + s.beta * s.weight, 0) * 100).toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Value at Risk (VaR) */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Value at Risk (VaR)
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography id="confidence-slider" gutterBottom>
            Confidence Level: {confidenceLevel}%
          </Typography>
          <Slider
            value={confidenceLevel}
            onChange={handleConfidenceChange}
            aria-labelledby="confidence-slider"
            step={1}
            marks={[
              { value: 90, label: '90%' },
              { value: 95, label: '95%' },
              { value: 99, label: '99%' },
            ]}
            min={90}
            max={99}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Daily VaR ({confidenceLevel}%)
                </Typography>
                <Typography variant="h4">
                  {(confidenceLevel === 95 ? sampleVaRData[0].daily : sampleVaRData[1].daily).toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expected maximum daily loss
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Weekly VaR ({confidenceLevel}%)
                </Typography>
                <Typography variant="h4">
                  {(confidenceLevel === 95 ? sampleVaRData[0].weekly : sampleVaRData[1].weekly).toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expected maximum weekly loss
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Monthly VaR ({confidenceLevel}%)
                </Typography>
                <Typography variant="h4">
                  {(confidenceLevel === 95 ? sampleVaRData[0].monthly : sampleVaRData[1].monthly).toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expected maximum monthly loss
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ height: 300, mt: 3 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { period: 'Daily', var: confidenceLevel === 95 ? sampleVaRData[0].daily : sampleVaRData[1].daily },
                { period: 'Weekly', var: confidenceLevel === 95 ? sampleVaRData[0].weekly : sampleVaRData[1].weekly },
                { period: 'Monthly', var: confidenceLevel === 95 ? sampleVaRData[0].monthly : sampleVaRData[1].monthly },
              ]}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="var" name={`Value at Risk (${confidenceLevel}%)`} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}

export default RiskAnalysis;