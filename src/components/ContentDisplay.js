import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, Typography, Chip, Divider } from '@mui/material';
import ReactPlayer from 'react-player';
import remarkGfm from 'remark-gfm';

// Custom renderer for images to handle local blob URLs
const ImageRenderer = ({ src, alt }) => {
  return (
    <Box sx={{ my: 2, textAlign: 'center' }}>
      <img 
        src={src} 
        alt={alt || 'Image'} 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '500px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }} 
      />
      {alt && <Typography variant="caption" color="text.secondary" display="block">{alt}</Typography>}
    </Box>
  );
};

// Custom renderer for videos to handle local blob URLs
const VideoRenderer = ({ src }) => {
  return (
    <Box sx={{ my: 2, textAlign: 'center' }}>
      <ReactPlayer
        url={src}
        controls
        width="100%"
        height="auto"
        style={{ maxHeight: '500px' }}
      />
    </Box>
  );
};

// Custom renderer for links
const LinkRenderer = ({ href, children }) => {
  // Check if the link is a video URL (blob URL or common video extensions)
  const isVideoUrl = href.startsWith('blob:') || 
                     href.endsWith('.mp4') || 
                     href.endsWith('.webm') || 
                     href.endsWith('.ogg') ||
                     href.endsWith('.mov');
  
  if (isVideoUrl) {
    return <VideoRenderer src={href} />;
  }
  
  // Check if the link is an image URL (blob URL or common image extensions)
  const isImageUrl = href.startsWith('blob:') || 
                     href.endsWith('.jpg') || 
                     href.endsWith('.jpeg') || 
                     href.endsWith('.png') || 
                     href.endsWith('.gif') ||
                     href.endsWith('.webp');
  
  if (isImageUrl) {
    return <ImageRenderer src={href} alt={children} />;
  }
  
  // Regular link
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
};

const ContentDisplay = ({ content }) => {
  if (!content) {
    return <Typography>No content selected</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{content.title}</Typography>
      
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip 
          label={content.category} 
          color="primary" 
          size="small" 
          sx={{ mr: 1 }} 
        />
        
        {content.tags && content.tags.map((tag, index) => (
          <Chip 
            key={index} 
            label={tag} 
            variant="outlined" 
            size="small" 
          />
        ))}
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ 
        '& img': { maxWidth: '100%', height: 'auto' },
        '& a': { color: 'primary.main' },
        '& pre': { 
          backgroundColor: 'grey.100', 
          p: 2, 
          borderRadius: 1,
          overflowX: 'auto'
        },
        '& code': { 
          backgroundColor: 'grey.100', 
          px: 0.5,
          borderRadius: 0.5,
          fontFamily: 'monospace'
        },
        '& blockquote': {
          borderLeft: '4px solid',
          borderColor: 'grey.300',
          pl: 2,
          ml: 0,
          fontStyle: 'italic'
        }
      }}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            img: ImageRenderer,
            a: LinkRenderer
          }}
        >
          {content.content}
        </ReactMarkdown>
      </Box>
    </Box>
  );
};

export default ContentDisplay;
