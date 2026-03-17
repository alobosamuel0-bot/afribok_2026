/**
 * OfflineIndicator Component
 * Shows when user is offline
 */

import React from 'react';
import { Alert, Box } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';

const OfflineIndicator = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999
      }}
    >
      <Alert
        severity="warning"
        icon={<CloudOffIcon />}
        sx={{
          borderRadius: 0,
          marginBottom: 0
        }}
      >
        You are offline. Changes will be saved locally and synced when connection is restored.
      </Alert>
    </Box>
  );
};

export default OfflineIndicator;
