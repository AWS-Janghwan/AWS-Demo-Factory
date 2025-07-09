import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContextCognito';

/**
 * Component for displaying an empty state
 * @param {Object} props - Component props
 * @param {string} props.title - Title text
 * @param {string} props.message - Message text
 * @param {boolean} props.showCreateButton - Whether to show create button
 * @param {JSX.Element} props.icon - Optional icon to display
 * @returns {JSX.Element} - Empty state component
 */
const EmptyState = ({ 
  title = 'No content found', 
  message = 'There is no content to display.', 
  showCreateButton = true,
  icon
}) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Box
      sx={{
        py: 8,
        textAlign: 'center',
        maxWidth: 500,
        mx: 'auto'
      }}
    >
      {icon && (
        <Box sx={{ mb: 3, color: 'text.secondary' }}>
          {icon}
        </Box>
      )}
      
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        {message}
      </Typography>
      
      {showCreateButton && isAuthenticated() && (
        <Button
          variant="contained"
          component={RouterLink}
          to="/create"
          startIcon={<AddIcon />}
          sx={{ mt: 2 }}
        >
          Create Content
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
