import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Box,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { useContent } from '../context/ContentContextAWS';
import { useAnalytics } from '../context/AnalyticsContext';
import { useAuth } from '../context/AuthContextCognito';

const CategoryPage = () => {
  const { category } = useParams();
  const { getContentsByCategory, loading, toggleLike, isLikedByUser } = useContent();
  const { trackPageView } = useAnalytics();
  const { user } = useAuth();
  const [contents, setContents] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  
  useEffect(() => {
    if (!loading) {
      // Convert URL parameter to proper category name
      const categoryMap = {
        'generative-ai': 'Generative AI',
        'manufacturing': 'Manufacturing',
        'retail-cpg': 'Retail/CPG',
        'telco-media': 'Telco/Media',
        'finance': 'Finance',
        'amazon-q': 'Amazon Q',
        'etc': 'ETC'
      };
      
      const mappedCategory = categoryMap[category] || category;
      setCategoryName(mappedCategory);
      
      const categoryContents = getContentsByCategory(mappedCategory);
      setContents(categoryContents);
      
      // Track page view
      trackPageView(`Category: ${mappedCategory}`, mappedCategory);
    }
  }, [category, loading, getContentsByCategory, trackPageView]);

  // Handle like button click
  const handleLikeClick = (e, contentId) => {
    e.preventDefault(); // Prevent navigation to content detail
    e.stopPropagation();
    
    if (user) {
      toggleLike(contentId, user.id);
      // Update local state to reflect changes
      const updatedContents = getContentsByCategory(categoryName);
      setContents(updatedContents);
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Generative AI':
        return '#5A3AA5';
      case 'Manufacturing':
        return '#FF9900';
      case 'Retail/CPG':
        return '#146EB4';
      case 'Telco/Media':
        return '#FF6B6B';
      case 'Finance':
        return '#4ECDC4';
      case 'Amazon Q':
        return '#FF9500';
      case 'ETC':
        return '#95A5A6';
      default:
        return '#232F3E';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4">Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <MuiLink component={Link} to="/" color="inherit" underline="hover">
          Home
        </MuiLink>
        <Typography color="text.primary">{categoryName}</Typography>
      </Breadcrumbs>
      
      {/* Category Header */}
      <Box 
        sx={{ 
          py: 4, 
          px: 3,
          mb: 4,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${getCategoryColor(categoryName)}15 0%, ${getCategoryColor(categoryName)}05 100%)`,
          border: `2px solid ${getCategoryColor(categoryName)}30`
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            color: getCategoryColor(categoryName)
          }}
        >
          {categoryName}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {contents.length}개의 콘텐츠가 있습니다
        </Typography>
      </Box>

      {/* Content Grid */}
      {contents.length === 0 ? (
        <Alert severity="info" sx={{ mt: 4 }}>
          이 카테고리에는 아직 콘텐츠가 없습니다.
        </Alert>
      ) : (
        <Grid container spacing={4}>
          {contents.map((item) => (
            <Grid item key={item.id} xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardActionArea 
                  component={Link} 
                  to={`/content/${item.id}`}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  {/* 썸네일 이미지 - 안전한 방식으로 표시 */}
                  {item.image && (
                    <CardMedia
                      component="img"
                      height="160"
                      image={item.image}
                      alt={item.title}
                      onError={(e) => {
                        console.warn('이미지 로드 실패:', item.image);
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {item.description}
                    </Typography>
                    
                    {/* 태그 (카테고리 제외) */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {item.tags && item.tags.slice(0, 3).map((tag) => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                      {item.tags && item.tags.length > 3 && (
                        <Chip 
                          label={`+${item.tags.length - 3}`} 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    {/* 작성일 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        By {item.author}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.createdAt)}
                      </Typography>
                    </Box>
                    
                    {/* 조회수와 좋아요 */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      pt: 1, 
                      borderTop: '1px solid', 
                      borderColor: 'divider' 
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {item.views || 0}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Tooltip title={user ? (isLikedByUser(item.id, user.id) ? "좋아요 취소" : "좋아요") : "로그인이 필요합니다"}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleLikeClick(e, item.id)}
                            disabled={!user}
                            sx={{ 
                              color: user && isLikedByUser(item.id, user.id) ? 'error.main' : 'text.secondary',
                              '&:hover': {
                                color: 'error.main'
                              }
                            }}
                          >
                            {user && isLikedByUser(item.id, user.id) ? 
                              <FavoriteIcon sx={{ fontSize: 16 }} /> : 
                              <FavoriteBorderIcon sx={{ fontSize: 16 }} />
                            }
                          </IconButton>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary">
                          {item.likes || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default CategoryPage;
