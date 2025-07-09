import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Chip
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';
import ReactPlayer from 'react-player';

const MediaGallery = ({ files = [] }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!files || files.length === 0) {
    return null;
  }

  const handleMediaClick = (file) => {
    setSelectedMedia(file);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMedia(null);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        첨부된 미디어 파일
      </Typography>
      
      <Grid container spacing={2}>
        {files.map((file, index) => (
          <Grid item xs={12} sm={6} md={4} key={file.id || index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
              onClick={() => handleMediaClick(file)}
            >
              {file.type?.startsWith('image/') ? (
                <CardMedia
                  component="img"
                  height="200"
                  image={file.url || '/placeholder-image.png'}
                  alt={file.name}
                  sx={{ objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDsl4bsnYw8L3RleHQ+PC9zdmc+';
                  }}
                />
              ) : (
                <Box
                  sx={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'grey.100',
                    position: 'relative'
                  }}
                >
                  <PlayArrowIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                  <Chip
                    label="비디오"
                    color="primary"
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  />
                </Box>
              )}
              
              <CardContent>
                <Typography variant="body2" noWrap title={file.name}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '크기 불명'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 미디어 상세 보기 다이얼로그 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box component="span" sx={{ fontSize: '1.25rem', fontWeight: 500 }}>
            {selectedMedia?.name}
          </Box>
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedMedia && (
            <Box sx={{ textAlign: 'center' }}>
              {selectedMedia.type?.startsWith('image/') ? (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDroZzrk5zsl5Ag7Iuk7YyoPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              ) : (
                <ReactPlayer
                  url={selectedMedia.url}
                  controls
                  width="100%"
                  height="auto"
                  style={{ maxHeight: '70vh' }}
                  onError={(error) => {
                    console.error('비디오 재생 오류:', error);
                  }}
                />
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MediaGallery;
