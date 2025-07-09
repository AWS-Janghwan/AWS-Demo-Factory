import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Component for displaying a loading spinner
 * @param {Object} props - Component props
 * @param {string} props.message - Optional message to display
 * @returns {JSX.Element} - Loading spinner component
 */
const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8
      }}
    >
      <CircularProgress size={40} />
      {message && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
