import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { Box, Typography, CircularProgress } from '@mui/material';

const VideoPlayer = ({ url, title, width = '100%', height = '360px' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleReady = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <Box sx={{ width, mb: 2 }}>
      <Box
        sx={{
          position: 'relative',
          paddingTop: '56.25%', // 16:9 aspect ratio
          backgroundColor: '#000',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <CircularProgress color="primary" />
          </Box>
        )}
        
        <ReactPlayer
          url={url}
          width="100%"
          height="100%"
          controls
          playing={false}
          onReady={handleReady}
          onError={handleError}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </Box>
      
      {title && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {title}
        </Typography>
      )}
      
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          Failed to load video. Please check the URL and try again.
        </Typography>
      )}
    </Box>
  );
};

export default VideoPlayer;
