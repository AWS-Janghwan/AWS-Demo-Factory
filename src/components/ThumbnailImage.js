import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';

/**
 * 썸네일 이미지 컴포넌트 - IndexedDB URL 새로고침 지원
 */
const ThumbnailImage = ({ 
  src, 
  alt, 
  width = 200, 
  height = 150, 
  fallbackText = "이미지 없음",
  onError = null 
}) => {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // src가 변경되면 에러 상태 초기화
  useEffect(() => {
    setImageError(false);
    setRetryCount(0);
  }, [src]);

  const handleImageError = (event) => {
    console.warn(`⚠️ [ThumbnailImage] 이미지 로드 실패: ${src}`);
    
    if (retryCount < maxRetries && src && src.startsWith('blob:')) {
      // Blob URL인 경우 잠시 후 재시도
      console.log(`🔄 [ThumbnailImage] ${retryCount + 1}번째 재시도...`);
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        // 이미지 요소를 강제로 다시 로드
        event.target.src = src + '?retry=' + (retryCount + 1);
      }, 500);
    } else {
      setImageError(true);
      if (onError) {
        onError(event);
      }
    }
  };

  const handleImageLoad = () => {
    console.log(`✅ [ThumbnailImage] 이미지 로드 성공: ${alt}`);
    setImageError(false);
  };

  if (!src || imageError) {
    return (
      <Box
        sx={{
          width,
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
          border: '1px dashed',
          borderColor: 'grey.300',
          borderRadius: 1
        }}
      >
        <ImageIcon sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
        <Typography variant="caption" color="grey.500" textAlign="center">
          {fallbackText}
        </Typography>
        {imageError && retryCount >= maxRetries && (
          <Typography variant="caption" color="error.main" textAlign="center" sx={{ mt: 0.5 }}>
            로드 실패
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={handleImageError}
      onLoad={handleImageLoad}
      sx={{
        width,
        height,
        objectFit: 'cover',
        borderRadius: 1,
        backgroundColor: 'grey.100'
      }}
    />
  );
};

export default ThumbnailImage;
