import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Paper,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Alert,
  Tooltip,
  Divider
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import ReactPlayer from 'react-player';
import { useContent } from '../context/ContentContextAWS';
import { useAnalytics } from '../context/AnalyticsContext';
import { useAuth } from '../context/AuthContextCognito';
import { getLocalFiles } from '../utils/amplifyConfig';
import SimpleMarkdownRenderer from '../components/SimpleMarkdownRenderer';

const ContentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getContentById, deleteContent, incrementViews, toggleLike, isLikedByUser, getSecureFileUrl } = useContent();
  const { trackPageView } = useAnalytics();
  const { user, isContentManager } = useAuth();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [viewIncremented, setViewIncremented] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hasEmptyUrls, setHasEmptyUrls] = useState(false);
  const [allFiles, setAllFiles] = useState([]); // 하이브리드 파일 시스템에서 로드

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const foundContent = getContentById(id); // parseInt 제거
        setContent(foundContent);
        
        if (foundContent) {
          // 콘텐츠 상세 분석을 위한 추가 정보 전달
          trackPageView(
            `Content: ${foundContent.title}`, 
            foundContent.category,
            foundContent.id,
            foundContent.title
          );
          
          // 조회수 증가 (한 번만)
          if (!viewIncremented) {
            incrementViews(foundContent.id);
            setViewIncremented(true);
          }
          
          // 하이브리드 파일 시스템에서 모든 파일 로드 (콘텐츠 파일이 있을 때만)
          try {
            let globalFiles = [];
            if (!foundContent.files || foundContent.files.length === 0) {
              globalFiles = await getLocalFiles();
            }
            
            // 콘텐츠 자체의 파일 정보와 전역 파일 목록 병합
            let combinedFiles = [...globalFiles];
            
            if (foundContent.files && foundContent.files.length > 0) {
              console.log(`📁 [ContentDetailPage] 콘텐츠 파일 ${foundContent.files.length}개 발견`);
              
              // 콘텐츠 파일들을 우선적으로 추가 (중복 제거 및 URL 생성)
              for (const contentFile of foundContent.files) {
                const existingFile = combinedFiles.find(f => f.name === contentFile.name);
                if (!existingFile) {
                  // S3 키가 있으면 보안 URL 생성 (항상 새로 생성)
                  if (contentFile.s3Key) {
                    try {
                      const secureUrl = await getSecureFileUrl(contentFile, 86400); // 24시간
                      contentFile.url = secureUrl;
                      console.log(`🔗 [ContentDetailPage] 콘텐츠 파일 보안 URL 생성: ${contentFile.name} -> ${secureUrl?.substring(0, 50)}...`);
                    } catch (urlError) {
                      console.error(`❌ [ContentDetailPage] 콘텐츠 파일 URL 생성 실패: ${contentFile.name}`, urlError);
                      // URL 생성 실패 시 빈 URL로 설정
                      contentFile.url = null;
                    }
                  }
                  
                  combinedFiles.unshift(contentFile); // 앞에 추가하여 우선순위 부여
                  console.log(`📁 [ContentDetailPage] 콘텐츠 파일 추가: ${contentFile.name}`);
                } else {
                  console.log(`📁 [ContentDetailPage] 중복 파일 스킵: ${contentFile.name}`);
                }
              }
            }
            
            setAllFiles(combinedFiles);
            console.log(`📁 [ContentDetailPage] 총 ${combinedFiles.length}개 파일 로드 완료 (콘텐츠: ${foundContent.files?.length || 0}개, 전역: ${globalFiles.length}개)`);
          } catch (fileError) {
            console.error('파일 로드 실패:', fileError);
            // 파일 로드 실패 시에도 콘텐츠 파일은 사용
            if (foundContent.files && foundContent.files.length > 0) {
              setAllFiles(foundContent.files);
              console.log(`📁 [ContentDetailPage] 콘텐츠 파일만 사용: ${foundContent.files.length}개`);
            } else {
              setAllFiles([]);
            }
          }
          
          // 빈 URL 체크
          const emptyUrls = foundContent.files?.some(file => !file.url || file.url.trim() === '') || false;
          setHasEmptyUrls(emptyUrls);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]); // id만 의존성으로 설정하여 무한 렌더링 방지

  // 수정/삭제 권한 체크 함수
  const canEditContent = () => {
    if (!user || !content) return false;
    
    // 관리자는 모든 콘텐츠 수정 가능
    if (isContentManager()) return true;
    
    // 작성자는 자신의 콘텐츠만 수정 가능
    return content.author === user.email || content.author === user.name;
  };

  // 콘텐츠 삭제 처리
  const handleDelete = async () => {
    try {
      await deleteContent(content.id);
      setDeleteDialogOpen(false);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('콘텐츠 삭제 실패:', error);
      alert('콘텐츠 삭제에 실패했습니다.');
    }
  };

  // 좋아요 핸들러
  const handleLikeClick = () => {
    if (user && content) {
      toggleLike(content.id, user.id);
      // 상태 업데이트를 위해 콘텐츠 다시 가져오기
      const updatedContent = getContentById(parseInt(id));
      setContent(updatedContent);
    }
  };

  const isLiked = user && content ? isLikedByUser(content.id, user.id) : false;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>로딩 중...</Typography>
      </Container>
    );
  }

  if (!content) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          콘텐츠를 찾을 수 없습니다
        </Typography>
        <MuiLink component={Link} to="/" color="primary">
          홈으로 돌아가기
        </MuiLink>
      </Container>
    );
  }

  // Get category path for breadcrumbs
  const categoryPath = content.category ? content.category.toLowerCase().replace('/', '-') : 'uncategorized';

  // 미디어 파일 분류 - 하이브리드 파일 시스템 사용

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 2 }}
      >
        <MuiLink component={Link} to="/" color="inherit" underline="hover">
          홈
        </MuiLink>
        <MuiLink 
          component={Link} 
          to={`/category/${categoryPath}`} 
          color="inherit" 
          underline="hover"
        >
          {content.category || 'Uncategorized'}
        </MuiLink>
        <Typography color="text.primary">{content.title}</Typography>
      </Breadcrumbs>
      
      {/* 빈 URL 경고 */}
      {hasEmptyUrls && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          일부 미디어 파일의 URL이 손실되었습니다. 콘텐츠를 수정하여 파일을 다시 업로드해주세요.
          <Button 
            size="small" 
            onClick={() => navigate(`/content/${content.id}/edit`)}
            sx={{ ml: 2 }}
          >
            수정하기
          </Button>
        </Alert>
      )}
      
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight={700} sx={{ flex: 1 }}>
            {content.title}
          </Typography>
          
          {/* 수정/삭제 버튼 - 권한이 있는 사용자만 표시 */}
          {canEditContent() && (
            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/content/${content.id}/edit`)}
                size="small"
              >
                수정
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
                size="small"
              >
                삭제
              </Button>
            </Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Chip 
            label={content.category || 'Uncategorized'}
            color="primary" 
            variant="outlined"
          />
          
          {content.tags && content.tags.map((tag) => (
            <Chip 
              key={tag}
              label={tag} 
              size="small" 
              variant="outlined"
            />
          ))}
        </Box>
        
        {/* 조회수, 좋아요, 작성일 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* 작성자 및 작성일 */}
            <Typography variant="body2" color="text.secondary">
              {content.author} • {new Date(content.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              {content.updatedAt !== content.createdAt && (
                <> • 수정됨 {new Date(content.updatedAt).toLocaleDateString('ko-KR')}</>
              )}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* 조회수 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <VisibilityIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {content.views || 0}
              </Typography>
            </Box>
            
            {/* 좋아요 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={user ? (isLiked ? "좋아요 취소" : "좋아요") : "로그인이 필요합니다"}>
                <IconButton
                  onClick={handleLikeClick}
                  disabled={!user}
                  size="small"
                  sx={{ 
                    color: isLiked ? 'error.main' : 'text.secondary',
                    '&:hover': {
                      color: 'error.main'
                    }
                  }}
                >
                  {isLiked ? <FavoriteIcon sx={{ fontSize: 20 }} /> : <FavoriteBorderIcon sx={{ fontSize: 20 }} />}
                </IconButton>
              </Tooltip>
              <Typography variant="body2" color="text.secondary">
                {content.likes || 0}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {content.description}
        </Typography>
      </Box>

      {/* 메인 콘텐츠 - 전체 너비 사용 */}
      <Box sx={{ width: '100%' }}>
        {/* 마크다운 콘텐츠 */}
        {content.content && (
          <Paper sx={{ p: 4 }}>
            <SimpleMarkdownRenderer content={content.content} files={allFiles || []} />
          </Paper>
        )}
      </Box>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          콘텐츠 삭제 확인
        </DialogTitle>
        <DialogContent>
          <Typography>
            정말로 이 콘텐츠를 삭제하시겠습니까?<br/>
            <strong>"{content.title}"</strong><br/>
            삭제된 콘텐츠는 복구할 수 없습니다.
          </Typography>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            취소
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
          >
            삭제
          </Button>
        </Box>
      </Dialog>

      {/* 미디어 확대 보기 다이얼로그 */}
      <Dialog
        open={mediaDialogOpen}
        onClose={() => setMediaDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: 'black' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: 'white',
          backgroundColor: 'black'
        }}>
          <Typography variant="h6" color="white">
            {selectedMedia?.name}
          </Typography>
          <IconButton 
            onClick={() => setMediaDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: 'black' }}>
          {selectedMedia && (
            selectedMedia.type.startsWith('video/') ? (
              <ReactPlayer
                url={selectedMedia.url}
                width="100%"
                height="70vh"
                controls
                playing
              />
            ) : (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            )
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ContentDetailPage;
