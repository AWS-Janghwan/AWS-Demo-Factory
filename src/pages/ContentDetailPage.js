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
  const { getContentById, deleteContent, incrementViews, toggleLike, isLikedByUser, getSecureFileUrl, loading: contextLoading } = useContent();
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
        // ContentContext가 아직 로딩 중이면 기다림
        if (contextLoading) {
          console.log('⏳ [ContentDetailPage] ContentContext 로딩 중, 대기...');
          return;
        }
        
        console.log('🔍 [ContentDetailPage] 콘텐츠 조회 시작:', id);
        const foundContent = await getContentById(id);
        
        if (!foundContent) {
          console.warn('❌ [ContentDetailPage] 콘텐츠를 찾을 수 없음:', id);
          setContent(null);
          setLoading(false);
          return;
        }
        
        console.log('✅ [ContentDetailPage] 콘텐츠 발견:', foundContent.title);
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
  }, [id, contextLoading]); // contextLoading을 의존성에 추가

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
      navigate('/');
    } catch (error) {
      console.error('콘텐츠 삭제 실패:', error);
    }
  };

  // 좋아요 토글 처리
  const handleToggleLike = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    try {
      await toggleLike(content.id, user.email || user.name);
      // 상태 업데이트는 Context에서 자동으로 처리됨
      const updatedContent = getContentById(content.id);
      setContent(updatedContent);
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
    }
  };

  // 미디어 다이얼로그 열기
  const handleMediaClick = (media) => {
    setSelectedMedia(media);
    setMediaDialogOpen(true);
  };

  console.log("🔍 [ContentDetailPage] 렌더링 상태:", { loading, contextLoading, content: content?.title, id });
  // 로딩 중이거나 콘텐츠가 없는 경우
  if (loading || contextLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6" align="center">
          콘텐츠를 불러오는 중... (디버깅 중)
        </Typography>
      </Container>
    );
  }

  if (!content) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          콘텐츠를 찾을 수 없습니다.
        </Alert>
        <Button component={Link} to="/" variant="contained">
          홈으로 돌아가기
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
        <MuiLink component={Link} to="/" underline="hover" color="inherit">
          홈
        </MuiLink>
        <MuiLink component={Link} to={`/?category=${encodeURIComponent(content.category)}`} underline="hover" color="inherit">
          {content.category}
        </MuiLink>
        <Typography color="text.primary">{content.title}</Typography>
      </Breadcrumbs>

      {/* Content Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ flex: 1, mr: 2 }}>
            {content.title}
          </Typography>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canEditContent() && (
              <>
                <Tooltip title="수정">
                  <IconButton 
                    component={Link} 
                    to={`/content/${content.id}/edit`}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="삭제">
                  <IconButton 
                    onClick={() => setDeleteDialogOpen(true)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
            
            {user && (
              <Tooltip title={isLikedByUser(content.id, user.email || user.name) ? "좋아요 취소" : "좋아요"}>
                <IconButton onClick={handleToggleLike} color="error">
                  {isLikedByUser(content.id, user.email || user.name) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Content Meta */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Chip label={content.category} color="primary" variant="outlined" />
          <Chip 
            icon={<VisibilityIcon />} 
            label={`조회 ${content.views || 0}`} 
            variant="outlined" 
          />
          <Chip 
            icon={<FavoriteIcon />} 
            label={`좋아요 ${content.likes || 0}`} 
            variant="outlined" 
          />
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
            작성자: {content.author} | {new Date(content.createdAt).toLocaleDateString('ko-KR')}
          </Typography>
        </Box>

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {content.tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
        )}

        {/* Description */}
        {content.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {content.description}
          </Typography>
        )}
      </Paper>

      {/* Empty URLs Warning */}
      {hasEmptyUrls && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          일부 파일의 URL이 생성되지 않았습니다. 파일을 다시 업로드해주세요.
        </Alert>
      )}

      {/* Content Body */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <SimpleMarkdownRenderer 
          content={content.content} 
          files={allFiles}
          onMediaClick={handleMediaClick}
        />
      </Paper>

      {/* Media Dialog */}
      <Dialog 
        open={mediaDialogOpen} 
        onClose={() => setMediaDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          미디어 보기
          <IconButton onClick={() => setMediaDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedMedia && (
            selectedMedia.type?.startsWith('image/') ? (
              <img 
                src={selectedMedia.url} 
                alt={selectedMedia.name}
                style={{ width: '100%', height: 'auto' }}
              />
            ) : selectedMedia.type?.startsWith('video/') ? (
              <ReactPlayer 
                url={selectedMedia.url}
                controls
                width="100%"
                height="auto"
              />
            ) : (
              <Typography>지원되지 않는 미디어 형식입니다.</Typography>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>콘텐츠 삭제</DialogTitle>
        <DialogContent>
          <Typography>
            정말로 이 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>취소</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            삭제
          </Button>
        </Box>
      </Dialog>
    </Container>
  );
};

export default ContentDetailPage;