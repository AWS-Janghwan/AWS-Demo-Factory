import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Divider,
  Button,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useContent } from '../context/ContentContextAWS';
import { useAuth } from '../context/AuthContextCognito';
import { useAnalytics } from '../context/AnalyticsContext';
import { getLocalFiles } from '../utils/amplifyConfig';
import ContentCard from '../components/ContentCard';
import ContentSlider from '../components/ContentSlider';

const HomePage = () => {
  console.log('🏠 [HomePage] 컴포넌트 렌더링 시작');
  
  const { contents, loading, getAllContents, getLatestContents } = useContent();
  const { isContentManager } = useAuth();
  const { trackVisitor } = useAnalytics();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContents, setFilteredContents] = useState([]);
  const [latestContents, setLatestContents] = useState([]);
  const [popularContents, setPopularContents] = useState([]);
  const [allFiles, setAllFiles] = useState([]);

  // 파일 목록 로드
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const files = await getLocalFiles();
        setAllFiles(files);
        console.log(`📁 [HomePage] ${files.length}개 파일 로드 완료`);
      } catch (error) {
        console.error('HomePage 파일 로드 실패:', error);
        setAllFiles([]);
      }
    };

    loadFiles();
  }, []);

  // 콘텐츠 데이터 로드 및 분류
  useEffect(() => {
    if (loading) return;
    
    const allContents = getAllContents();
    
    // Latest Content (최신 12개 - 3행 4열)
    const latest = getLatestContents(12);
    setLatestContents(latest);
    
    // Popular Content (조회수 + 좋아요 기준으로 정렬, 상위 8개)
    const popular = [...allContents]
      .sort((a, b) => {
        const scoreA = (a.views || 0) * 1 + (a.likes || 0) * 2; // 좋아요에 더 높은 가중치
        const scoreB = (b.views || 0) * 1 + (b.likes || 0) * 2;
        return scoreB - scoreA;
      })
      .slice(0, 8);
    setPopularContents(popular);
    
  }, [loading, contents, getAllContents, getLatestContents]);
  
  // Filter contents based on search query
  useEffect(() => {
    if (loading) return;
    
    if (searchQuery.trim() === '') {
      setFilteredContents([]);
    } else {
      const query = searchQuery.toLowerCase();
      const allContents = getAllContents();
      const filtered = allContents.filter(content => 
        content.title.toLowerCase().includes(query) ||
        content.description?.toLowerCase().includes(query) ||
        (content.tags && content.tags.some(tag => tag.toLowerCase().includes(query)))
      );
      setFilteredContents(filtered);
    }
  }, [searchQuery, loading, contents, getAllContents]);

  // Get category URL
  const getCategoryUrl = (category) => {
    switch (category) {
      case 'Generative AI':
        return 'generative-ai';
      case 'Manufacturing':
        return 'manufacturing';
      case 'Retail/CPG':
        return 'retail-cpg';
      case 'Telco/Media':
        return 'telco-media';
      case 'Finance':
        return 'finance';
      case 'Amazon Q':
        return 'amazon-q';
      case 'ETC':
        return 'etc';
      default:
        return category.toLowerCase().replace(/[^a-z0-9]/g, '-');
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Generative AI':
        return '#5A3AA5';
      case 'Manufacturing':
        return '#1E8900';
      case 'Retail/CPG':
        return '#FF9900';
      case 'Telco/Media':
        return '#D13212';
      case 'Finance':
        return '#00A1C9';
      case 'Amazon Q':
        return '#0073BB';
      case 'ETC':
        return '#232F3E';
      default:
        return '#232F3E';
    }
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
      {/* Hero Section */}
      <Box 
        sx={{ 
          py: 6, 
          px: 4, 
          mb: 6, 
          borderRadius: 2, 
          backgroundColor: '#232F3E',
          color: 'white',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" paragraph sx={{ maxWidth: '900px', fontWeight: 500, fontSize: '1.8rem', lineHeight: 1.4 }}>
            AWS의 최신 기술 트렌드와 데모, 튜토리얼, 베스트 프랙티스를 경험해보세요.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <TextField
              placeholder="데모, 튜토리얼 등을 검색하세요..."
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ 
                maxWidth: '800px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 1
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            {isContentManager() && (
              <Button
                component={Link}
                to="/upload"
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                sx={{ 
                  backgroundColor: '#FF9900',
                  '&:hover': {
                    backgroundColor: '#E88B00'
                  }
                }}
              >
                콘텐츠 작성
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Background pattern */}
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '100%',
            opacity: 0.1,
            background: 'url(https://d1.awsstatic.com/webteam/homepage/heroes/background-pattern.8aa9b1d3b7e6d04a1f4b8f4e383e0e6c9a1d1f9d.png)',
            backgroundSize: 'cover',
            zIndex: 0
          }} 
        />
      </Box>
      
      {/* Search Results (검색 시에만 표시) */}
      {searchQuery && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
            🔍 Search Results
          </Typography>
          
          {filteredContents.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                검색 결과가 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                다른 키워드로 검색해보세요
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {filteredContents.map((content) => (
                <Grid item key={content.id} xs={12} sm={6} md={4} lg={3}>
                  <ContentCard content={content} allFiles={allFiles} compact />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
      
      {/* Latest Content Section (검색하지 않을 때만 표시) */}
      {!searchQuery && (
        <>
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h2" fontWeight={600} sx={{ mr: 2 }}>
                📅 Latest Content
              </Typography>
              <Chip 
                label={`${latestContents.length}개`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
            
            {latestContents.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  아직 콘텐츠가 없습니다
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  첫 번째 콘텐츠를 작성해보세요!
                </Typography>
                {isContentManager() && (
                  <Button
                    component={Link}
                    to="/upload"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ backgroundColor: '#FF9900' }}
                  >
                    콘텐츠 작성하기
                  </Button>
                )}
              </Card>
            ) : (
              <Grid container spacing={3}>
                {latestContents.map((content) => (
                  <Grid item key={content.id} xs={12} sm={6} md={4} lg={3}>
                    <ContentCard content={content} allFiles={allFiles} compact />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          <Divider sx={{ mb: 6 }} />

          {/* Popular Content Section */}
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TrendingUpIcon sx={{ mr: 1, color: '#FF9900' }} />
              <Typography variant="h5" component="h2" fontWeight={600} sx={{ mr: 2 }}>
                🔥 Popular Content
              </Typography>
              <Chip 
                label={`${popularContents.length}개`} 
                size="small" 
                color="secondary" 
                variant="outlined"
                sx={{ backgroundColor: '#FFF3E0' }}
              />
            </Box>
            
            {popularContents.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  인기 콘텐츠가 없습니다
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  콘텐츠에 좋아요와 조회수가 쌓이면 여기에 표시됩니다
                </Typography>
              </Card>
            ) : (
              <ContentSlider 
                contents={popularContents}
                allFiles={allFiles}
                showRanking={true}
              />
            )}
          </Box>
        </>
      )}
    </Container>
  );
};

export default HomePage;
