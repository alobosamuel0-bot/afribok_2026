/**
 * Navbar Component
 * Top navigation bar
 */

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon
} from '@mui/icons-material';

const Navbar = ({ user, onLogout, isOnline }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await onLogout();
  };

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        {/* Logo/Title */}
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <HospitalIconLogo />
          <Typography variant="h6" sx={{ ml: 2, fontWeight: 'bold' }}>
            Afribok 2026
          </Typography>
        </Box>

        {/* Online Status */}
        <Chip
          icon={isOnline ? <CloudIcon /> : <CloudOffIcon />}
          label={isOnline ? 'Online' : 'Offline'}
          color={isOnline ? 'success' : 'warning'}
          variant="outlined"
          size="small"
          sx={{ mr: 2, color: 'white', borderColor: 'white' }}
        />

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ mr: 1, bgcolor: 'secondary.main', cursor: 'pointer' }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            size="small"
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem disabled>
            <Typography variant="body2">
              {user?.username}
            </Typography>
          </MenuItem>
          <MenuItem disabled>
            <Typography variant="caption">
              Role: {user?.role || 'staff'}
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

const HospitalIconLogo = () => (
  <Box
    sx={{
      width: 36,
      height: 36,
      bgcolor: 'white',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      color: 'primary.main'
    }}
  >
    H
  </Box>
);

export default Navbar;
