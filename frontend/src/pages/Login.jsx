import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../context/AuthContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(4),
}));

const Logo = styled('div')(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 'bold',
  color: theme.palette.primary.main,
}));

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, loading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Check for messages from other pages (like after registration)
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    // For demo purposes, allow login with demo credentials
    if (username === 'test' && password === 'test@123') {
      // Store a demo token
      localStorage.setItem('token', 'demo_token');
      
      // Create a demo user object
      const demoUser = {
        username: 'test',
        email: 'test@example.com',
        full_name: 'Test User'
      };
      
      // Set the current user in auth context
      await login(username, password, demoUser);
      
      // Navigate to the page user was trying to access or dashboard
      const from = location.state?.from || '/';
      navigate(from);
      return;
    }
    
    const success = await login(username, password);
    if (success) {
      // Navigate to the page user was trying to access or dashboard
      const from = location.state?.from || '/';
      navigate(from);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <StyledPaper elevation={3}>
          <LogoContainer>
            <Logo>IndiVest</Logo>
          </LogoContainer>

          <Typography component="h1" variant="h5" gutterBottom>
            Sign in
          </Typography>

          {message && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={toggleShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={authLoading}
            >
              {authLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Grid container>
              <Grid item xs>
                <Link to="#" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Forgot password?
                  </Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Don't have an account? Sign Up
                  </Typography>
                </Link>
              </Grid>
            </Grid>

            <Divider sx={{ mt: 3, mb: 2 }} />

            <Typography variant="body2" color="text.secondary" align="center">
              Demo credentials: username: "test", password: "test@123"
            </Typography>
          </Box>
        </StyledPaper>
      </Box>
    </Container>
  );
}

export default Login;