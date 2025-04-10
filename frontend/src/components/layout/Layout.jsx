import React, { useState, useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: '100%',
    maxWidth: '1200px',
    [theme.breakpoints.down('md')]: {
      marginLeft: open ? `${drawerWidth}px` : 0,
      width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
    },
    [theme.breakpoints.up('md')]: {
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: open ? theme.spacing(4) : theme.spacing(3),
    },
  }),
);

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'center',
  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
}));

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Portfolio', icon: <AccountBalanceWalletIcon />, path: '/portfolio' },
  { text: 'Market Data', icon: <ShowChartIcon />, path: '/market' },
  { text: 'Risk Analysis', icon: <AssessmentIcon />, path: '/risk' },
  { text: 'Sentiment Analysis', icon: <SentimentSatisfiedAltIcon />, path: '/sentiment' },
];

function Layout() {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme, theme } = useContext(ThemeContext);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // TODO: Implement logout functionality
    handleMenuClose();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isMenuOpen = Boolean(anchorEl);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            IndiVest
          </Typography>
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ mr: 2 }}
            aria-label="toggle theme"
          >
            {theme === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={isMenuOpen}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBarStyled>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 60%, #0d47a1 100%)',
            color: 'white',
            boxShadow: '0 4px 20px 0 rgba(0,0,0,0.2)',
            borderRight: 'none',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 15%)',
              opacity: 0.6,
            },
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 'bold', 
            color: 'white', 
            letterSpacing: '1.5px',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            '&::before': {
              content: '""',
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4caf50',
              marginRight: '10px',
              boxShadow: '0 0 8px #4caf50'
            }
          }}>
            IndiVest
          </Typography>
        </DrawerHeader>
        <List sx={{ mt: 2, px: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 1.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: '12px',
                  py: 1.2,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.16)',
                    backdropFilter: 'blur(10px)',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: '4px',
                      backgroundColor: '#fff',
                      borderRadius: '0 2px 2px 0',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.24)',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: 'white', 
                  minWidth: '40px',
                  opacity: location.pathname === item.path ? 1 : 0.8,
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                      fontSize: '0.95rem',
                      letterSpacing: '0.5px',
                      transition: 'all 0.2s ease',
                    } 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
}

export default Layout;