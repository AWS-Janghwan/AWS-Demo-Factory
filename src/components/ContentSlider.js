import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import ContentCard from './ContentCard';

const ContentSlider = ({ contents, allFiles = [], title, showRanking = false }) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeftStart] = useState(0);
  const scrollContainerRef = useRef(null);
  const autoScrollRef = useRef(null);

  // 스크롤 가능 여부 확인
  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      setScrollPosition(scrollLeft);
    }
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    checkScrollability();
  };

  // 좌우 스크롤 함수
  const scrollLeftBtn = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 280; // 카드 너비 + 간격
      const scrollAmount = window.innerWidth < 768 ? cardWidth : cardWidth * 2;
      scrollContainerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRightBtn = () => {
    if (scrollContainerRef.current) {
      const cardWidth = 280; // 카드 너비 + 간격
      const scrollAmount = window.innerWidth < 768 ? cardWidth : cardWidth * 2;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 드래그 핸들러
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftStart(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!scrollContainerRef.current) return;

    // 드래그 중일 때
    if (isDragging) {
      e.preventDefault();
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2; // 스크롤 속도 조정
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
      return;
    }

    // 호버 자동 스크롤
    if (isHovering) {
      const rect = scrollContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const position = x / width; // 0 ~ 1 사이 값
      setHoverPosition(position);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsDragging(false);
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
  };

  // 자동 스크롤 효과
  useEffect(() => {
    if (isHovering && !isDragging && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const { scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth;

      if (maxScroll > 0) {
        // 마우스 위치에 따라 스크롤 속도 결정
        let scrollSpeed = 0;
        if (hoverPosition < 0.2) {
          // 왼쪽 20% 영역에서 왼쪽으로 스크롤
          scrollSpeed = -2 * (0.2 - hoverPosition) / 0.2;
        } else if (hoverPosition > 0.8) {
          // 오른쪽 20% 영역에서 오른쪽으로 스크롤
          scrollSpeed = 2 * (hoverPosition - 0.8) / 0.2;
        }

        if (scrollSpeed !== 0) {
          autoScrollRef.current = setInterval(() => {
            const currentScroll = container.scrollLeft;
            const newScroll = Math.max(0, Math.min(maxScroll, currentScroll + scrollSpeed));
            container.scrollLeft = newScroll;
            
            // 스크롤이 끝에 도달하면 정지
            if (newScroll === 0 || newScroll === maxScroll) {
              clearInterval(autoScrollRef.current);
            }
          }, 16); // 60fps
        }
      }
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isHovering, hoverPosition, isDragging]);

  // 마우스 진입/이탈 핸들러
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  // 전역 마우스 이벤트 리스너 추가
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    const handleGlobalMouseMove = (e) => {
      if (isDragging && scrollContainerRef.current) {
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX, scrollLeft]);

  // 초기 스크롤 상태 확인
  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [contents]);

  if (!contents || contents.length === 0) {
    return null;
  }

  return (
    <Box sx={{ position: 'relative', mb: 4 }}>
      {/* 제목 */}
      {title && (
        <Typography variant="h5" component="h2" fontWeight={600} sx={{ mb: 3 }}>
          {title}
        </Typography>
      )}

      {/* 슬라이더 컨테이너 */}
      <Box sx={{ position: 'relative' }}>
        {/* 왼쪽 스크롤 버튼 */}
        <IconButton
          onClick={scrollLeftBtn}
          disabled={!canScrollLeft}
          sx={{
            position: 'absolute',
            left: { xs: -15, sm: -20 },
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            backgroundColor: 'white',
            boxShadow: 2,
            width: { xs: 35, sm: 40 },
            height: { xs: 35, sm: 40 },
            opacity: canScrollLeft ? 0.9 : 0.3,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'grey.100',
              boxShadow: 3,
              opacity: 1
            },
            '&:disabled': {
              backgroundColor: 'grey.200'
            },
            border: '1px solid',
            borderColor: 'grey.300'
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
        </IconButton>

        {/* 오른쪽 스크롤 버튼 */}
        <IconButton
          onClick={scrollRightBtn}
          disabled={!canScrollRight}
          sx={{
            position: 'absolute',
            right: { xs: -15, sm: -20 },
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            backgroundColor: 'white',
            boxShadow: 2,
            width: { xs: 35, sm: 40 },
            height: { xs: 35, sm: 40 },
            opacity: canScrollRight ? 0.9 : 0.3,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'grey.100',
              boxShadow: 3,
              opacity: 1
            },
            '&:disabled': {
              backgroundColor: 'grey.200'
            },
            border: '1px solid',
            borderColor: 'grey.300'
          }}
        >
          <ChevronRightIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
        </IconButton>

        {/* 스크롤 컨테이너 */}
        <Box
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          sx={{
            display: 'flex',
            gap: { xs: 2, sm: 3 },
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollBehavior: isDragging ? 'auto' : 'smooth',
            pb: 2,
            px: { xs: 0.5, sm: 1 },
            // 스크롤바 숨기기
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            // 마우스 커서 변경
            cursor: isDragging ? 'grabbing' : isHovering ? 'grab' : 'default',
            userSelect: 'none',
            // 그라데이션 페이드 효과
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 20,
              background: 'linear-gradient(to right, rgba(255,255,255,0.8), transparent)',
              zIndex: 5,
              pointerEvents: 'none',
              opacity: canScrollLeft ? 1 : 0,
              transition: 'opacity 0.3s ease'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 20,
              background: 'linear-gradient(to left, rgba(255,255,255,0.8), transparent)',
              zIndex: 5,
              pointerEvents: 'none',
              opacity: canScrollRight ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }
          }}
        >
          {contents.map((content, index) => (
            <Box
              key={content.id}
              sx={{
                position: 'relative',
                minWidth: { xs: 240, sm: 260 },
                maxWidth: { xs: 240, sm: 260 },
                flexShrink: 0,
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.02)'
                }
              }}
            >
              {/* 순위 배지 (인기 콘텐츠인 경우) */}
              {showRanking && index < 3 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    left: -8,
                    zIndex: 10,
                    backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                    color: index === 1 ? '#333' : 'white',
                    borderRadius: '50%',
                    width: { xs: 24, sm: 28 },
                    height: { xs: 24, sm: 28 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: { xs: '10px', sm: '12px' },
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    border: '2px solid white'
                  }}
                >
                  {index + 1}
                </Box>
              )}

              <ContentCard content={content} allFiles={allFiles} compact />

              {/* 인기도 지표 (인기 콘텐츠인 경우) */}
              {showRanking && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    fontSize: { xs: '10px', sm: '11px' },
                    display: 'flex',
                    alignItems: 'center',
                    gap: { xs: 0.5, sm: 0.8 },
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <VisibilityIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />
                    <span>{content.views || 0}</span>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <FavoriteIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />
                    <span>{content.likes || 0}</span>
                  </Box>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        {/* 호버 가이드 */}
        {isHovering && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -35,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 1,
              fontSize: { xs: '10px', sm: '12px' },
              pointerEvents: 'none',
              opacity: 0.8,
              transition: 'opacity 0.3s ease',
              whiteSpace: 'nowrap'
            }}
          >
            💡 마우스를 좌우 끝으로 이동하면 자동 스크롤됩니다
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ContentSlider;
