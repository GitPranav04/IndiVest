import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  marginTop: theme.spacing(4),
}));

const ErrorIcon = styled(ErrorOutlineIcon)(({ theme }) => ({
  fontSize: '5rem',
  color: theme.palette.error.main,
  marginBottom: theme.spacing(2),
}));

function NotFound() {
  return (
    <Container maxWidth="md">
      <StyledPaper elevation={3}>
        <ErrorIcon />
        <Typography variant="h2" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Box mt={4}>
          <Button
            component={Link}
            to="/"
            variant="contained"
            color="primary"
            size="large"
          >
            Back to Dashboard
          </Button>
        </Box>
      </StyledPaper>
    </Container>
  );
}

export default NotFound;