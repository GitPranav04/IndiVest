import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Layout components
import Layout from './components/layout/Layout';

// Page components
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import MarketData from './pages/MarketData';
import RiskAnalysis from './pages/RiskAnalysis';
import SentimentAnalysis from './pages/SentimentAnalysis';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Auth context
import { AuthProvider, RequireAuth } from './context/AuthContext';

// Create theme function that accepts mode
const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#121212',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none',
    },
  },
});

// Protected route wrapper for Layout and its child routes
const ProtectedLayout = () => (
  <RequireAuth>
    <Layout />
  </RequireAuth>
);

function AppContent() {
  const { theme } = useTheme();
  return (
    <MuiThemeProvider theme={createAppTheme(theme === 'dark' ? 'dark' : 'light')}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="market" element={<MarketData />} />
            <Route path="risk" element={<RiskAnalysis />} />
            <Route path="sentiment" element={<SentimentAnalysis />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;