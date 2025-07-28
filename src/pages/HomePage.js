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
import ContentSearch from '../components/ContentSearch';
import useContentSearch from '../hooks/useContentSearch';

const HomePage = () => {
  console.log('🏠 [HomePage] 컴포넌트 렌더링 시작');
  
  const { contents, loading, getAllContents, getLatestContents } = useContent();
  const { isContentManager } = useAuth();
  const [latestContents, setLatestContents] = useState([]);
  const [popularContents, setPopularContents] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  
  // 검색 기능 훅 사용
  const {
    searchResults,
    handleSearch,
    searchStats,
    categoryStats,
    popularTags
  } = useContentSearch();

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
  
  // 검색 결과 상태 관리
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // 문의하기 모달 상태
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  
  // 검색 핸들러
  const onSearchHandler = (searchParams) => {
    handleSearch(searchParams);
    const hasActiveSearch = searchParams.query || 
                           searchParams.category || 
                           searchParams.author || 
                           searchParams.tags.length > 0;
    setShowSearchResults(hasActiveSearch);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4">Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          py: 3, 
          px: 4, 
          mb: 4, 
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
          
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            {/* 검색 컴포넌트 */}
            <Box sx={{ width: '100%' }}>
              <ContentSearch
                onSearch={onSearchHandler}
                totalResults={showSearchResults ? searchResults.length : contents?.length || 0}
                loading={loading}
              />
            </Box>
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
      
      {/* 검색 결과 (검색 시에만 표시) */}
      {showSearchResults && (
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" component="h2" fontWeight={600}>
              🔍 검색 결과
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`${searchResults.length}개 결과`} 
                color="primary" 
                variant="outlined"
              />
              {searchStats.hasActiveSearch && (
                <Chip 
                  label={`전체 ${searchStats.totalContents}개 중`} 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          
          {searchResults.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                검색 결과가 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                다른 키워드나 필터를 사용해보세요
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {searchResults.map((content) => (
                <Grid item key={content.id} xs={12} sm={6} md={4} lg={3}>
                  <ContentCard content={content} allFiles={allFiles} compact />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
      
      {/* Latest Content Section (검색하지 않을 때만 표시) */}
      {!showSearchResults && (
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
