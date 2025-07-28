import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  Paper,
  Grid,
  Button,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { CATEGORIES } from '../context/ContentContextAWS';

const ContentSearch = ({ 
  onSearch, 
  onFilter, 
  totalResults = 0,
  loading = false 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // 검색 디바운싱을 위한 타이머
  const [searchTimer, setSearchTimer] = useState(null);

  // 검색어 변경 시 디바운싱 적용
  useEffect(() => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    
    const timer = setTimeout(() => {
      handleSearch();
    }, 300); // 300ms 디바운싱
    
    setSearchTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchQuery]);

  // 필터 변경 시 즉시 검색
  useEffect(() => {
    handleSearch();
  }, [selectedCategory, selectedAuthor, selectedTags, sortBy]);

  const handleSearch = () => {
    const searchParams = {
      query: searchQuery.trim(),
      category: selectedCategory,
      author: selectedAuthor,
      tags: selectedTags,
      sortBy: sortBy
    };
    
    console.log('🔍 [ContentSearch] 검색 실행:', searchParams);
    
    if (onSearch) {
      onSearch(searchParams);
    }
  };

  const handleTagAdd = (tag) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedAuthor('');
    setSelectedTags([]);
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedAuthor || selectedTags.length > 0;

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ mb: 0.5 }}>
          🔍 콘텐츠 검색
        </Typography>
        
        {/* 검색 결과 요약 */}
        <Typography variant="body2" color="text.secondary">
          {loading ? '검색 중...' : `총 ${totalResults}개의 콘텐츠`}
        </Typography>
      </Box>

      {/* 기본 검색 */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <TextField
            fullWidth
            placeholder="제목, 내용, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        <Box sx={{ flex: '0 0 180px' }}>
          <FormControl fullWidth>
            <InputLabel>카테고리</InputLabel>
            <Select
              value={selectedCategory}
              label="카테고리"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              {Object.values(CATEGORIES).map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ flex: '0 0 120px' }}>
          <FormControl fullWidth>
            <InputLabel>정렬</InputLabel>
            <Select
              value={sortBy}
              label="정렬"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="newest">최신순</MenuItem>
              <MenuItem value="oldest">오래된순</MenuItem>
              <MenuItem value="title">제목순</MenuItem>
              <MenuItem value="views">조회수순</MenuItem>
              <MenuItem value="likes">좋아요순</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ flex: '0 0 80px' }}>
          <Button
            variant="outlined"
            onClick={() => setShowAdvanced(!showAdvanced)}
            fullWidth
            size="small"
            sx={{ minWidth: 'auto', px: 1 }}
          >
            <FilterIcon sx={{ mr: 0.5 }} />
            {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Button>
        </Box>
      </Box>

      {/* 고급 필터 */}
      <Collapse in={showAdvanced}>
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="작성자"
                placeholder="작성자 이메일 또는 이름"
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="태그 추가"
                placeholder="태그를 입력하고 Enter를 누르세요"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTagAdd(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </Grid>
          </Grid>
          
          {/* 선택된 태그 표시 */}
          {selectedTags.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                선택된 태그:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleTagRemove(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* 필터 초기화 */}
      {hasActiveFilters && (
        <Box sx={{ mt: 1.5, textAlign: 'right' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ClearIcon />}
            onClick={handleClearAll}
          >
            모든 필터 초기화
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default ContentSearch;