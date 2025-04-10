import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import PortfolioCreation from '../components/portfolio/PortfolioCreation';

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

const steps = ['Account Details', 'Personal Information', 'Portfolio Setup', 'Verification'];

function Register() {
  const navigate = useNavigate();
  const { register: authRegister, loading: authLoading, error: authError } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    agreeToTerms: false,
    portfolioData: null,
  });

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'agreeToTerms' ? checked : value,
    });
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handlePortfolioComplete = (portfolioData) => {
    setFormData(prev => ({
      ...prev,
      portfolioData
    }));
    handleNext();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate all required fields
    if (!formData.username || !formData.email || !formData.password || !formData.fullName || !formData.phone || !formData.portfolioData) {
      setError('Please fill in all required fields and complete all steps.');
      setLoading(false);
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // Validate password strength
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        setLoading(false);
        return;
      }

      // Prepare user data for registration
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        portfolio_data: formData.portfolioData
      };
      
      // Register user using auth service
      const success = await authRegister(userData);
      
      if (success) {
        // Navigate to login page after successful registration
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      } else {
        // Handle specific error messages from the backend
        let errorMessage = authError || 'Registration failed. Please try again.';
        
        // Check for specific error types
        if (errorMessage.toLowerCase().includes('username') && errorMessage.toLowerCase().includes('exists')) {
          setError('Username is already taken. Please choose a different username.');
        } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('exists')) {
          setError('Email is already registered. Please use a different email address.');
        } else if (errorMessage.toLowerCase().includes('invalid email')) {
          setError('Please enter a valid email address.');
        } else if (errorMessage.toLowerCase().includes('invalid phone')) {
          setError('Please enter a valid phone number.');
        } else {
          setError(errorMessage);
        }
      }
    } catch (err) {
      console.error('Registration error:', err);
      // Handle network or server errors
      if (!navigator.onLine) {
        setError('Please check your internet connection and try again.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const validateStep = () => {
    if (activeStep === 0) {
      return (
        formData.username && 
        formData.email && 
        formData.password && 
        formData.confirmPassword && 
        formData.password === formData.confirmPassword
      );
    } else if (activeStep === 1) {
      return formData.fullName && formData.phone;
    } else if (activeStep === 2) {
      return formData.portfolioData !== null;
    } else {
      return true;
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
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
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
              helperText={
                formData.password !== formData.confirmPassword && formData.confirmPassword !== ''
                  ? 'Passwords do not match'
                  : ''
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={toggleShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="fullName"
              label="Full Name"
              name="fullName"
              autoComplete="name"
              value={formData.fullName}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="phone"
              label="Phone Number"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="address"
              label="Address"
              name="address"
              autoComplete="address-line1"
              value={formData.address}
              onChange={handleChange}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="city"
                  label="City"
                  name="city"
                  autoComplete="address-level2"
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="state"
                  label="State"
                  name="state"
                  autoComplete="address-level1"
                  value={formData.state}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
            <TextField
              margin="normal"
              fullWidth
              id="pincode"
              label="PIN Code"
              name="pincode"
              autoComplete="postal-code"
              value={formData.pincode}
              onChange={handleChange}
            />
          </>
        );
      case 2:
        return <PortfolioCreation onComplete={handlePortfolioComplete} />;
      case 3:
        return (
          <>
            <Typography variant="body1" gutterBottom>
              Please review your information to complete your registration.
            </Typography>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1">Account Information:</Typography>
              <Typography variant="body2">Username: {formData.username}</Typography>
              <Typography variant="body2">Email: {formData.email}</Typography>
            </Box>
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1">Personal Information:</Typography>
              <Typography variant="body2">Name: {formData.fullName}</Typography>
              <Typography variant="body2">Phone: {formData.phone}</Typography>
              {formData.address && (
                <Typography variant="body2">
                  Address: {formData.address}, {formData.city}, {formData.state}, {formData.pincode}
                </Typography>
              )}
            </Box>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <StyledPaper elevation={3}>
          <LogoContainer>
            <Logo>IndiVest</Logo>
          </LogoContainer>

          <Typography component="h1" variant="h5" gutterBottom>
            Create an Account
          </Typography>

          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" sx={{ mt: 1, width: '100%' }}>
            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0 || loading}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!validateStep() || loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Register'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!validateStep()}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mt: 3, mb: 2, width: '100%' }} />

          <Grid container justifyContent="center">
            <Grid item>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Already have an account? Sign In
                </Typography>
              </Link>
            </Grid>
          </Grid>
        </StyledPaper>
      </Box>
    </Container>
  );
}

export default Register;