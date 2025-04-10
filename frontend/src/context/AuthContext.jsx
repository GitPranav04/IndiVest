import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { authService } from '../services/api';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Fetch current user data
          const userData = await authService.getCurrentUser();
          setCurrentUser(userData);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        // Clear invalid token
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login function
  const login = async (username, password, demoUser = null) => {
    try {
      setError('');
      setLoading(true);
      
      // If demo user is provided, initialize with real market data
      if (demoUser) {
        console.log('Setting demo user:', demoUser);
        
        // Create an enhanced demo user with real market data
        const enhancedDemoUser = {
          ...demoUser,
          portfolio: {
            id: 'demo-portfolio',
            name: 'Demo Portfolio',
            holdings: [
              { symbol: 'RELIANCE', quantity: 100 },
              { symbol: 'INFY', quantity: 150 },
              { symbol: 'HDFCBANK', quantity: 75 },
              { symbol: 'TCS', quantity: 50 },
              { symbol: 'ICICIBANK', quantity: 120 }
            ]
          }
        };

        // Initialize real-time market data for demo portfolio
        try {
          const { marketDataService } = await import('../services/marketData');
          
          // Fetch real-time data for holdings
          const holdingsData = await Promise.all(
            enhancedDemoUser.portfolio.holdings.map(async (holding) => {
              const stockData = await marketDataService.getStockPrice(holding.symbol);
              return {
                ...holding,
                currentPrice: parseFloat(stockData['05. price']) || 0,
                change: parseFloat(stockData['09. change']) || 0,
                changePercent: parseFloat(stockData['10. change percent']) || 0
              };
            })
          );

          enhancedDemoUser.portfolio.holdings = holdingsData;
          enhancedDemoUser.portfolio.lastUpdated = new Date().toISOString();
        } catch (error) {
          console.warn('Failed to fetch real-time market data for demo user:', error);
        }

        setCurrentUser(enhancedDemoUser);
        return true;
      }
      
      const response = await authService.login(username, password);
      
      // Debug log to see the response structure
      console.log('Login response in AuthContext:', response);
      
      // Store token - handle both camelCase and snake_case formats
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
      } else if (response.accessToken) {
        localStorage.setItem('token', response.accessToken);
      } else {
        throw new Error('No access token found in response');
      }
      
      // Fetch user data
      const userData = await authService.getCurrentUser();
      setCurrentUser(userData);
      
      return true;
    } catch (err) {
      console.error('Login error in AuthContext:', err);
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError('');
      setLoading(true);
      await authService.register(userData);
      return true;
    } catch (err) {
      console.error('Registration error in AuthContext:', err);
      // Handle specific error cases
      if (err.message.includes('username') && err.message.toLowerCase().includes('exists')) {
        setError('Username is already taken. Please choose a different username.');
      } else if (err.message.includes('email') && err.message.toLowerCase().includes('exists')) {
        setError('Email is already registered. Please use a different email address.');
      } else if (err.message.includes('Network error')) {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    navigate('/login');
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Auth guard component for protected routes
export const RequireAuth = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for both currentUser and token in localStorage
    const token = localStorage.getItem('token');
    
    if (!loading) {
      if (currentUser || token) {
        setIsAuthenticated(true);
      } else {
        // Redirect to login with the return url
        navigate('/login', { state: { from: location.pathname } });
      }
    }
  }, [currentUser, loading, navigate, location]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? children : null;
};