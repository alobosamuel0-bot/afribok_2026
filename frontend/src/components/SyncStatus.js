/**
 * SyncStatus Component
 * Shows sync queue status and operations
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
  Box,
  Typography,
  Chip
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const SyncStatus = ({ stats, onClose }) => {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const total = stats.pending + stats.synced + stats.failed;
  const progress = total > 0 ? Math.round((stats.synced / total) * 100) : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SyncIcon sx={{ animation: 'spin 2s linear infinite' }} />
        Sync Status
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* Progress Bar */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Syncing operations...
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.synced} / {total}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>

          {/* Status Chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<SyncIcon />}
              label={`${stats.pending} Pending`}
              variant="outlined"
              color={stats.pending > 0 ? 'warning' : 'default'}
            />
            <Chip
              icon={<CheckCircleIcon />}
              label={`${stats.synced} Synced`}
              variant="outlined"
              color={stats.synced > 0 ? 'success' : 'default'}
            />
            {stats.failed > 0 && (
              <Chip
                icon={<ErrorIcon />}
                label={`${stats.failed} Failed`}
                variant="outlined"
                color="error"
              />
            )}
          </Box>

          {/* Info */}
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ display: 'block', mt: 2 }}
          >
            Your changes are being synced to the server. You can continue working offline.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Dialog>
  );
};

export default SyncStatus;
