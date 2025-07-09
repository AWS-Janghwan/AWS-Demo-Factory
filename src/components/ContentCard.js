import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import ThumbnailImage from './ThumbnailImage';
import { getLocalFiles } from '../utils/amplifyConfig';
import { useContent } from '../context/ContentContextAWS';
import { useAuth } from '../context/AuthContextCognito';

const ContentCard = ({ content, allFiles = [], compact = false }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [loading, setLoading] = useState(true);

  const { toggleLike, isLikedByUser, getSecureFileUrl } = useContent();
  const { user } = useAuth();

  // Handle like button click
  const handleLikeClick = (e) => {
    e.preventDefault(); // Prevent navigation to content detail
    e.stopPropagation();
    
    if (user) {
      toggleLike(content.id, user.id);
    }
  };

  const isLiked = user ? isLikedByUser(content.id, user.id) : false;

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

  // 콘텐츠에서 사용된 미디어 파일 찾기 (보안 URL 지원)
  useEffect(() => {
    const findContentMedia = async () => {
      try {
        // 1. 콘텐츠에서 미디어 태그 추출
        const imageMatches = content.content?.match(/\[image:([^\]]+)\]/g) || [];
        const videoMatches = content.content?.match(/\[video:([^\]]+)\]/g) || [];
        
        if (imageMatches.length === 0 && videoMatches.length === 0) {
          setLoading(false);
          return;
        }

        // 2. 콘텐츠의 파일 목록에서 먼저 찾기 (보안 파일 포함)
        let filesToSearch = content.files || [];
        
        // 3. 추가 파일 목록이 있으면 합치기
        if (allFiles.length > 0) {
          filesToSearch = [...filesToSearch, ...allFiles];
        }
        
        // 4. 로컬 파일도 확인 (폴백)
        if (filesToSearch.length === 0) {
          console.log(`🔄 [ContentCard] ${content.title}: 파일 목록 직접 로드`);
          filesToSearch = await getLocalFiles();
        }
        
        // 이미지 파일 찾기 (썸네일용)
        for (const imageMatch of imageMatches) {
          const fileName = imageMatch.match(/\[image:([^\]]+)\]/)[1];
          const imageFile = filesToSearch.find(file => file.name === fileName);
          
          if (imageFile) {
            let imageUrl = null;
            
            // 보안 파일인 경우 보안 URL 생성
            if (imageFile.isSecure && imageFile.s3Key) {
              try {
                console.log(`🔒 [ContentCard] ${content.title}: 보안 썸네일 URL 생성 중...`);
                imageUrl = await getSecureFileUrl(imageFile, 86400); // 24시간 유효
              } catch (error) {
                console.warn(`⚠️ [ContentCard] 보안 URL 생성 실패: ${fileName}`, error);
              }
            } else if (imageFile.url) {
              imageUrl = imageFile.url;
            }
            
            if (imageUrl) {
              console.log(`🖼️ [ContentCard] ${content.title} 썸네일 발견: ${fileName}`);
              setThumbnailUrl(imageUrl);
              break; // 첫 번째 이미지를 썸네일로 사용
            }
          }
        }
        
        // 비디오 파일 확인
        if (videoMatches.length > 0) {
          setHasVideo(true);
          console.log(`🎥 [ContentCard] ${content.title} 비디오 ${videoMatches.length}개 발견`);
        }
        
      } catch (error) {
        console.error(`❌ [ContentCard] ${content.title} 미디어 로드 실패:`, error);
      } finally {
        setLoading(false);
      }
    };

    findContentMedia();
  }, [content.content, content.title, content.files, allFiles, getSecureFileUrl]);

  // 컴팩트 모드에 따른 높이 설정
  const cardHeight = compact ? 320 : 400;
  const imageHeight = compact ? 140 : 180;

  return (
    <Card 
      sx={{ 
        height: cardHeight,
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        },
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <CardActionArea 
        component={Link} 
        to={`/content/${content.id}`}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        {/* 미디어 섹션 */}
        <Box sx={{ position: 'relative', height: imageHeight, backgroundColor: 'grey.100' }}>
          <ThumbnailImage
            src={thumbnailUrl}
            alt={content.title}
            width="100%"
            height={imageHeight}
            fallbackText={loading ? "로딩 중..." : "이미지 없음"}
            onError={(e) => console.warn(`썸네일 로드 실패: ${content.title}`)}
          />
          
          {/* 비디오 재생 아이콘 오버레이 */}
          {hasVideo && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '50%',
                width: compact ? 40 : 50,
                height: compact ? 40 : 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PlayArrowIcon sx={{ color: 'white', fontSize: compact ? 20 : 24 }} />
            </Box>
          )}
          

        </Box>

        {/* 콘텐츠 정보 */}
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: compact ? 1.5 : 2 }}>
          <Typography 
            variant={compact ? "subtitle2" : "h6"} 
            component="h3" 
            gutterBottom 
            fontWeight="bold"
            sx={{
              fontSize: compact ? '0.9rem' : '1.1rem',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {content.title}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            paragraph
            sx={{ 
              flexGrow: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: compact ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              fontSize: compact ? '0.75rem' : '0.875rem',
              lineHeight: 1.4,
              mb: 1
            }}
          >
            {content.description}
          </Typography>
          
          {/* 카테고리와 날짜 */}
          <Box sx={{ mt: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: compact ? 0.5 : 1 }}>
              <Chip 
                label={content.category || 'Uncategorized'} 
                size="small" 
                sx={{
                  backgroundColor: getCategoryColor(content.category),
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: compact ? '0.65rem' : '0.75rem',
                  height: compact ? 20 : 24
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: compact ? '0.65rem' : '0.75rem' }}>
                {new Date(content.createdAt).toLocaleDateString('ko-KR', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>
            
            {/* 태그 (컴팩트 모드에서는 최대 2개만) */}
            {content.tags && content.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3, mt: compact ? 0.5 : 1 }}>
                {content.tags.slice(0, compact ? 2 : 3).map((tag) => (
                  <Chip 
                    key={tag}
                    label={tag} 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      fontSize: compact ? '0.6rem' : '0.65rem', 
                      height: compact ? 16 : 18,
                      '& .MuiChip-label': {
                        px: 0.5
                      }
                    }}
                  />
                ))}
                {content.tags.length > (compact ? 2 : 3) && (
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', fontSize: '0.6rem' }}>
                    +{content.tags.length - (compact ? 2 : 3)}
                  </Typography>
                )}
              </Box>
            )}
            
            {/* 조회수와 좋아요 */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              mt: compact ? 0.5 : 1, 
              pt: compact ? 0.5 : 1, 
              borderTop: '1px solid', 
              borderColor: 'divider' 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <VisibilityIcon sx={{ fontSize: compact ? 12 : 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: compact ? '0.65rem' : '0.75rem' }}>
                  {content.views || 0}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <Tooltip title={user ? (isLiked ? "좋아요 취소" : "좋아요") : "로그인이 필요합니다"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleLikeClick}
                      disabled={!user}
                      sx={{ 
                        color: isLiked ? 'error.main' : 'text.secondary',
                        '&:hover': {
                          color: 'error.main'
                        },
                        p: compact ? 0.3 : 0.5
                      }}
                    >
                      {isLiked ? 
                        <FavoriteIcon sx={{ fontSize: compact ? 12 : 14 }} /> : 
                        <FavoriteBorderIcon sx={{ fontSize: compact ? 12 : 14 }} />
                      }
                    </IconButton>
                  </span>
                </Tooltip>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: compact ? '0.65rem' : '0.75rem' }}>
                  {content.likes || 0}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ContentCard;
