import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  Grid,
} from '@mui/material';

const steps = ['Investment Goals', 'Risk Profile', 'Initial Investment'];

const PortfolioCreation = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [portfolioData, setPortfolioData] = useState({
    investmentGoal: '',
    timeHorizon: '',
    riskTolerance: 'moderate',
    initialInvestment: 10000,
    monthlyContribution: 1000,
    preferredSectors: [],
  });

  const handleChange = (field) => (event) => {
    setPortfolioData({
      ...portfolioData,
      [field]: event.target.value,
    });
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onComplete(portfolioData);
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const renderInvestmentGoals = () => (
    <Box sx={{ mt: 2 }}>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Investment Goal</InputLabel>
        <Select
          value={portfolioData.investmentGoal}
          onChange={handleChange('investmentGoal')}
          label="Investment Goal"
        >
          <MenuItem value="retirement">Retirement Planning</MenuItem>
          <MenuItem value="wealth">Wealth Building</MenuItem>
          <MenuItem value="savings">Short-term Savings</MenuItem>
          <MenuItem value="education">Education Fund</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Investment Timeframe</InputLabel>
        <Select
          value={portfolioData.timeHorizon}
          onChange={handleChange('timeHorizon')}
          label="Investment Timeframe"
        >
          <MenuItem value="short">1-3 years</MenuItem>
          <MenuItem value="medium">3-7 years</MenuItem>
          <MenuItem value="long">7+ years</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );

  const renderRiskProfile = () => (
    <Box sx={{ mt: 2 }}>
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">Risk Tolerance</FormLabel>
        <RadioGroup
          value={portfolioData.riskTolerance}
          onChange={handleChange('riskTolerance')}
        >
          <FormControlLabel
            value="conservative"
            control={<Radio />}
            label="Conservative - Prefer stability over high returns"
          />
          <FormControlLabel
            value="moderate"
            control={<Radio />}
            label="Moderate - Balance between stability and growth"
          />
          <FormControlLabel
            value="aggressive"
            control={<Radio />}
            label="Aggressive - Willing to take risks for higher returns"
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );

  const renderInitialInvestment = () => (
    <Box sx={{ mt: 2 }}>
      <Typography gutterBottom>Initial Investment Amount (₹)</Typography>
      <Slider
        value={portfolioData.initialInvestment}
        onChange={(_, value) =>
          setPortfolioData({ ...portfolioData, initialInvestment: value })
        }
        min={1000}
        max={1000000}
        step={1000}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `₹${value.toLocaleString()}`}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        type="number"
        label="Initial Investment"
        value={portfolioData.initialInvestment}
        onChange={(e) =>
          setPortfolioData({
            ...portfolioData,
            initialInvestment: Number(e.target.value),
          })
        }
        sx={{ mb: 3 }}
      />

      <Typography gutterBottom>Monthly Contribution (₹)</Typography>
      <Slider
        value={portfolioData.monthlyContribution}
        onChange={(_, value) =>
          setPortfolioData({ ...portfolioData, monthlyContribution: value })
        }
        min={0}
        max={100000}
        step={500}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `₹${value.toLocaleString()}`}
        sx={{ mb: 3 }}
      />
      <TextField
        fullWidth
        type="number"
        label="Monthly Contribution"
        value={portfolioData.monthlyContribution}
        onChange={(e) =>
          setPortfolioData({
            ...portfolioData,
            monthlyContribution: Number(e.target.value),
          })
        }
      />
    </Box>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderInvestmentGoals();
      case 1:
        return renderRiskProfile();
      case 2:
        return renderInitialInvestment();
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4, mb: 2 }}>
        {getStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
        >
          {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default PortfolioCreation;