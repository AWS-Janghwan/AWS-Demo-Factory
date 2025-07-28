import { useState, useEffect, useMemo } from 'react';
import { useContent } from '../context/ContentContextAWS';

const useContentSearch = () => {
  const { contents, loading } = useContent();
  const [searchResults, setSearchResults] = useState([]);
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: '',
    author: '',
    tags: [],
    sortBy: 'newest'
  });

  // 검색 및 필터링 로직
  const filteredAndSortedContents = useMemo(() => {
    if (!contents || contents.length === 0) {
      return [];
    }

    let filtered = [...contents];

    // 텍스트 검색 (제목, 내용, 태그)
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase();
      filtered = filtered.filter(content => {
        const titleMatch = content.title?.toLowerCase().includes(query);
        const contentMatch = content.content?.toLowerCase().includes(query);
        const descriptionMatch = content.description?.toLowerCase().includes(query);
        const tagsMatch = content.tags?.some(tag => 
          tag.toLowerCase().includes(query)
        );
        const authorMatch = content.author?.toLowerCase().includes(query);
        
        return titleMatch || contentMatch || descriptionMatch || tagsMatch || authorMatch;
      });
    }

    // 카테고리 필터
    if (searchParams.category) {
      filtered = filtered.filter(content => 
        content.category === searchParams.category
      );
    }

    // 작성자 필터
    if (searchParams.author) {
      const author = searchParams.author.toLowerCase();
      filtered = filtered.filter(content => 
        content.author?.toLowerCase().includes(author)
      );
    }

    // 태그 필터
    if (searchParams.tags && searchParams.tags.length > 0) {
      filtered = filtered.filter(content => {
        if (!content.tags || content.tags.length === 0) return false;
        
        return searchParams.tags.every(searchTag =>
          content.tags.some(contentTag =>
            contentTag.toLowerCase().includes(searchTag.toLowerCase())
          )
        );
      });
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (searchParams.sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'likes':
          return (b.likes || 0) - (a.likes || 0);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  }, [contents, searchParams]);

  // 검색 결과 업데이트
  useEffect(() => {
    setSearchResults(filteredAndSortedContents);
  }, [filteredAndSortedContents]);

  // 검색 함수
  const handleSearch = (newSearchParams) => {
    console.log('🔍 [useContentSearch] 검색 파라미터 업데이트:', newSearchParams);
    setSearchParams(newSearchParams);
  };

  // 검색 초기화
  const clearSearch = () => {
    setSearchParams({
      query: '',
      category: '',
      author: '',
      tags: [],
      sortBy: 'newest'
    });
  };

  // 통계 정보
  const searchStats = useMemo(() => {
    const totalContents = contents?.length || 0;
    const filteredContents = searchResults.length;
    const hasActiveSearch = searchParams.query || 
                           searchParams.category || 
                           searchParams.author || 
                           searchParams.tags.length > 0;

    return {
      totalContents,
      filteredContents,
      hasActiveSearch,
      searchParams
    };
  }, [contents, searchResults, searchParams]);

  // 카테고리별 통계
  const categoryStats = useMemo(() => {
    if (!contents) return {};
    
    return contents.reduce((stats, content) => {
      const category = content.category || 'Uncategorized';
      stats[category] = (stats[category] || 0) + 1;
      return stats;
    }, {});
  }, [contents]);

  // 작성자별 통계
  const authorStats = useMemo(() => {
    if (!contents) return {};
    
    return contents.reduce((stats, content) => {
      const author = content.author || 'Unknown';
      stats[author] = (stats[author] || 0) + 1;
      return stats;
    }, {});
  }, [contents]);

  // 인기 태그 추출
  const popularTags = useMemo(() => {
    if (!contents) return [];
    
    const tagCounts = {};
    contents.forEach(content => {
      if (content.tags && content.tags.length > 0) {
        content.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [contents]);

  return {
    // 검색 결과
    searchResults,
    loading,
    
    // 검색 함수
    handleSearch,
    clearSearch,
    
    // 통계
    searchStats,
    categoryStats,
    authorStats,
    popularTags,
    
    // 현재 검색 상태
    searchParams
  };
};

export default useContentSearch;