/**
 * StatsCard Component
 * Statistics card for dashboard
 */

import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';

const StatsCard = ({ title, value, icon, color = 'primary' }) => {
  const colorMap = {
    primary: { bg: '#e3f2fd', text: '#1976d2' },
    success: { bg: '#e8f5e9', text: '#388e3c' },
    error: { bg: '#ffebee', text: '#d32f2f' },
    warning: { bg: '#fff3e0', text: '#f57c00' },
    info: { bg: '#e0f2f1', text: '#00897b' }
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography color="textSecondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: colors.bg,
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.text,
              fontSize: 28
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 28 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
