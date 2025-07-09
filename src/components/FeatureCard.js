import React from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip } from '@mui/material';
import { Link } from 'react-router-dom';

const FeatureCard = ({ title, description, image, category, tags, link }) => {
  // Determine background color based on category
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Generative AI':
        return '#5A3AA5'; // purple
      case 'Manufacturing':
        return '#1E8900'; // green
      case 'Retail/CPG':
        return '#FF9900'; // orange
      case 'Finance':
        return '#00A1C9'; // teal
      case 'Telco/Media':
        return '#D13212'; // red
      default:
        return '#0073BB'; // blue
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 2,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box component={Link} to={link} sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CardMedia
          component="img"
          height="160"
          image={image}
          alt={title}
        />
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Chip 
            label={category} 
            size="small" 
            sx={{ 
              alignSelf: 'flex-start', 
              mb: 1.5,
              backgroundColor: getCategoryColor(category),
              color: 'white',
              fontWeight: 500
            }} 
          />
          <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description}
          </Typography>
          {tags && tags.length > 0 && (
            <Box sx={{ mt: 'auto', display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {tags.map((tag) => (
                <Chip 
                  key={tag} 
                  label={tag} 
                  size="small" 
                  variant="outlined" 
                  sx={{ fontSize: '0.75rem' }} 
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Box>
    </Card>
  );
};

export default FeatureCard;
