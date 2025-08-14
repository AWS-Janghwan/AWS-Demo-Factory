import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import { 
  Box, 
  Typography, 
  Link, 
  Paper,
  Divider,
  Card,
  Dialog,
  DialogContent,
  IconButton,
  Button
} from '@mui/material';
import { Close as CloseIcon, Refresh as RefreshIcon } from '@mui/icons-material';

import { useContent } from '../context/ContentContextAWS';
import urlManager from '../utils/urlManager';

const SimpleMarkdownRenderer = ({ content, files = [] }) => {
  // 이미지 모달 상태
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  
  // URL 오류 상태 관리
  const [failedUrls, setFailedUrls] = useState(new Set());
  const [refreshingUrls, setRefreshingUrls] = useState(new Set());
  
  // 이미지 클릭 핸들러
  const handleImageClick = (file) => {
    setSelectedImage(file);
    setImageModalOpen(true);
  };

  // 미디어 로드 오류 처리
  const handleMediaError = (file, error) => {
    console.warn(`⚠️ [SimpleMarkdownRenderer] 미디어 로드 실패: ${file.name}`, error);
    setFailedUrls(prev => new Set([...prev, file.s3Key || file.name]));
  };

  // URL 새로고침 처리
  const handleUrlRefresh = async (file) => {
    if (!file.s3Key) return;
    
    const key = file.s3Key;
    setRefreshingUrls(prev => new Set([...prev, key]));
    
    try {
      console.log(`🔄 [SimpleMarkdownRenderer] URL 새로고침 시작: ${file.name}`);
      
      // 강제로 새로운 URL 생성
      await urlManager.getSmartUrl(key, true);
      
      // 실패 목록에서 제거
      setFailedUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      
      console.log(`✅ [SimpleMarkdownRenderer] URL 새로고침 완료: ${file.name}`);
      
      // 페이지 새로고침으로 새 URL 적용
      window.location.reload();
      
    } catch (error) {
      console.error(`❌ [SimpleMarkdownRenderer] URL 새로고침 실패: ${file.name}`, error);
    } finally {
      setRefreshingUrls(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  // 이미지 모달 닫기
  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setSelectedImage(null);
  };

  // 미디어 태그를 React 컴포넌트로 교체하는 함수
  const renderContentWithMedia = (text) => {
    if (!text || !files.length) return text;

    // 미디어 태그 처리 시작

    // 미디어 태그 패턴: [image:filename] 또는 [video:filename]
    const mediaTagPattern = /\[(image|video):([^\]]+)\]/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mediaTagPattern.exec(text)) !== null) {
      // 태그 이전의 텍스트 추가
      if (match.index > lastIndex) {
        const textPart = text.slice(lastIndex, match.index);
        if (textPart.trim()) {
          parts.push({
            type: 'markdown',
            content: textPart,
            key: `text-${lastIndex}`
          });
        }
      }

      const [fullMatch, mediaType, fileName] = match;
      // 태그 발견
      
      // 파일 목록에서 해당 파일 찾기 (안전한 방식)
      const mediaFile = files.find(file => {
        // fileName이 undefined이거나 file.name이 undefined인 경우 처리
        if (!fileName || !file || !file.name) {
          return false;
        }
        
        // 안전한 문자열 비교
        const nameMatch = (file.name && fileName && fileName !== 'undefined') && (
          file.name === fileName || 
          file.name.includes(fileName) ||
          fileName.includes(file.name)
        );
        // 파일 매칭 시도
        return nameMatch;
      });

      if (mediaFile && mediaFile.url) {
        // URL 유효성 검사 - S3 URL, IndexedDB Blob URL, Data URL 모두 지원
        const isValidUrl = mediaFile.url.startsWith('data:') || 
                          mediaFile.url.startsWith('https://') || // S3 URL 지원
                          mediaFile.url.startsWith('http://') ||  // HTTP URL 지원
                          (mediaFile.url.startsWith('blob:') && mediaFile.isIndexedDB) ||
                          (mediaFile.url.startsWith('blob:') && mediaFile.isPermanent);
        
        if (isValidUrl) {
          // 파일 매칭 성공
          parts.push({
            type: 'media',
            mediaType,
            file: mediaFile,
            key: `media-${match.index}`
          });
        } else {
          // 유효하지 않은 URL
          // 유효하지 않은 URL에 대한 안내 메시지 표시
          parts.push({
            type: 'broken-media',
            mediaType,
            fileName,
            key: `broken-${match.index}`
          });
        }
      } else {
        // 파일을 찾을 수 없음
        // 파일을 찾을 수 없으면 누락된 미디어로 표시
        parts.push({
          type: 'missing-media',
          mediaType,
          fileName,
          key: `missing-${match.index}`
        });
      }

      lastIndex = match.index + fullMatch.length;
    }

    // 마지막 부분의 텍스트 추가
    if (lastIndex < text.length) {
      const textPart = text.slice(lastIndex);
      if (textPart.trim()) {
        parts.push({
          type: 'markdown',
          content: textPart,
          key: `text-${lastIndex}`
        });
      }
    }

    return parts;
  };

  // 깨진 미디어 컴포넌트 렌더링
  const renderBrokenMediaComponent = (mediaType, fileName) => {
    return (
      <Paper 
        sx={{ 
          p: 2, 
          my: 2, 
          backgroundColor: 'error.light', 
          color: 'error.contrastText',
          border: '1px dashed',
          borderColor: 'error.main'
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          ⚠️ {mediaType === 'image' ? '이미지' : '비디오'} 파일을 불러올 수 없습니다
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          파일명: {fileName}
        </Typography>
        <Typography variant="caption">
          브라우저를 재시작한 후 파일이 사라졌을 수 있습니다. 
          콘텐츠를 수정하여 파일을 다시 업로드해주세요.
        </Typography>
      </Paper>
    );
  };

  // 누락된 미디어 컴포넌트 렌더링
  const renderMissingMediaComponent = (mediaType, fileName) => {
    // fileName이 undefined이거나 null인 경우 처리
    if (!fileName || fileName === 'undefined') {
      // 파일명이 유효하지 않음
      return (
        <Paper sx={{ p: 2, m: 1, bgcolor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <Typography color="warning.main">
            ⚠️ 파일 정보가 손상되었습니다. 콘텐츠를 다시 편집해주세요.
          </Typography>
        </Paper>
      );
    }
    
    // 해당 파일 찾기 (안전한 검색)
    const file = files.find(f => {
      if (!f || !f.name) return false;
      return f.name === fileName || f.name.includes(fileName);
    });
    const isRefreshing = file?.s3Key && refreshingUrls.has(file.s3Key);
    const hasFailed = file?.s3Key && failedUrls.has(file.s3Key);
    
    return (
      <Paper 
        sx={{ 
          p: 2, 
          my: 2, 
          backgroundColor: 'warning.light', 
          color: 'warning.contrastText',
          border: '1px dashed',
          borderColor: 'warning.main'
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          📁 {mediaType === 'image' ? '이미지' : '비디오'} 파일을 찾을 수 없습니다
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          파일명: {fileName}
        </Typography>
        
        {/* S3 파일인 경우 새로고침 버튼 표시 */}
        {file?.s3Key ? (
          <Box>
            {hasFailed && (
              <Typography variant="caption" color="error" display="block" gutterBottom>
                URL이 만료되었거나 접근할 수 없습니다
              </Typography>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => handleUrlRefresh(file)}
              disabled={isRefreshing}
              sx={{ mt: 1 }}
            >
              {isRefreshing ? '새로고침 중...' : 'URL 새로고침'}
            </Button>
          </Box>
        ) : (
          <Typography variant="caption">
            파일이 업로드되지 않았거나 삭제되었을 수 있습니다.
          </Typography>
        )}
      </Paper>
    );
  };

  const renderMediaComponent = (file, mediaType) => {
    // file 객체가 없는 경우 안전한 처리
    if (!file) {
      // 파일 객체가 undefined
      return (
        <Paper sx={{ p: 2, m: 1, bgcolor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <Typography color="warning.main">
            ⚠️ 파일 정보가 손상되었습니다. 콘텐츠를 다시 편집해주세요.
          </Typography>
        </Paper>
      );
    }
    
    if (mediaType === 'image') {
      // 이미지 컴포넌트 렌더링
      
      // URL이 없거나 유효하지 않은 경우 오류 메시지 표시
      if (!file.url || file.url.trim() === '') {
        // 이미지 URL이 없음
        return (
          <Card sx={{ maxWidth: '100%', my: 2, p: 2, textAlign: 'center', backgroundColor: '#fff3cd' }}>
            <Typography variant="body2" color="warning.main">
              ⚠️ 이미지 파일을 불러올 수 없습니다
            </Typography>

            <Typography variant="caption" display="block" color="text.secondary">
              브라우저를 재시작한 후 파일이 사라졌을 수 있습니다. 콘텐츠를 수정하여 파일을 다시 업로드해주세요.
            </Typography>
          </Card>
        );
      }
      
      return (
        <Box sx={{ my: 2, maxWidth: '100%' }}>
          <img
            src={file.url}
            alt={file.name}
            style={{
              maxHeight: '400px',
              maxWidth: '100%',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
            onClick={() => handleImageClick(file)}
            onError={(e) => handleMediaError(file, e)}
          />
        </Box>
      );
    } else if (mediaType === 'video') {
      // 비디오 컴포넌트 렌더링
      return (
        <Card sx={{ maxWidth: '100%', my: 2 }}>
          <Box sx={{ position: 'relative', paddingTop: '56.25%' /* 16:9 aspect ratio */ }}>
            <video
              src={file.url}
              width="100%"
              height="100%"
              style={{ position: 'absolute', top: 0, left: 0, backgroundColor: '#000' }}
              controls
              preload="auto"
              controlsList="nodownload"
              crossOrigin="anonymous"
              playsInline
              onError={(e) => handleMediaError(file, e)}
              onLoadStart={() => {
                // 비디오 로드 시작
              }}
              onCanPlay={(e) => {
                // 비디오가 재생 가능할 때 시킹 활성화
                const video = e.target;
                if (video.readyState >= 2) {
                  // 시킹 가능 상태로 설정
                  video.setAttribute('data-seeking-enabled', 'true');
                }
              }}
              onLoadedMetadata={(e) => {
                // 메타데이터 로드 완료 시 시킹 준비
                const video = e.target;
                if (video.duration && video.duration > 0) {
                  // 시킹 가능 상태로 설정
                  video.setAttribute('data-seeking-ready', 'true');
                }
              }}
              onProgress={(e) => {
                // 비디오 다운로드 진행 상황 업데이트
                const video = e.target;
                if (video.buffered.length > 0) {
                  // 버퍼링된 부분에서 시킹 가능
                  video.setAttribute('data-buffered', 'true');
                }
              }}
            >
              브라우저가 비디오를 지원하지 않습니다.
            </video>
          </Box>

        </Card>
      );
    }
    return null;
  };

  const components = {
    // 코드 블록 렌더링
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <Box sx={{ my: 2 }}>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </Box>
      ) : (
        <Box
          component="code"
          sx={{
            backgroundColor: 'grey.100',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontFamily: 'monospace',
            fontSize: '0.875em'
          }}
          {...props}
        >
          {children}
        </Box>
      );
    },

    // 제목 렌더링
    h1: ({ children }) => (
      <Typography variant="h3" component="h1" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),
    h2: ({ children }) => (
      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),
    h3: ({ children }) => (
      <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1.5, fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),
    h4: ({ children }) => (
      <Typography variant="h6" component="h4" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),

    // 문단 렌더링
    p: ({ children }) => (
      <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mb: 2 }}>
        {children}
      </Typography>
    ),

    // 링크 렌더링
    a: ({ href, children }) => (
      <Link href={href} target="_blank" rel="noopener noreferrer" color="primary">
        {children}
      </Link>
    ),

    // 리스트 렌더링
    ul: ({ children }) => (
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        {children}
      </Box>
    ),
    ol: ({ children }) => (
      <Box component="ol" sx={{ pl: 3, mb: 2 }}>
        {children}
      </Box>
    ),
    li: ({ children }) => (
      <Typography component="li" variant="body1" sx={{ mb: 0.5, lineHeight: 1.6 }}>
        {children}
      </Typography>
    ),

    // 인용문 렌더링
    blockquote: ({ children }) => (
      <Paper
        elevation={0}
        sx={{
          borderLeft: 4,
          borderColor: 'primary.main',
          backgroundColor: 'grey.50',
          p: 2,
          my: 2,
          fontStyle: 'italic'
        }}
      >
        {children}
      </Paper>
    ),

    // 구분선 렌더링
    hr: () => <Divider sx={{ my: 3 }} />,

    // 테이블 렌더링
    table: ({ children }) => (
      <Box sx={{ overflowX: 'auto', my: 2 }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          {children}
        </Box>
      </Box>
    ),
    th: ({ children }) => (
      <Box
        component="th"
        sx={{
          border: 1,
          borderColor: 'divider',
          p: 1,
          backgroundColor: 'grey.100',
          fontWeight: 'bold',
          textAlign: 'left'
        }}
      >
        {children}
      </Box>
    ),
    td: ({ children }) => (
      <Box
        component="td"
        sx={{
          border: 1,
          borderColor: 'divider',
          p: 1
        }}
      >
        {children}
      </Box>
    )
  };

  if (!content) {
    return (
      <Typography variant="body2" color="text.secondary" fontStyle="italic">
        콘텐츠가 없습니다.
      </Typography>
    );
  }

  // 미디어 태그를 포함한 콘텐츠를 파트별로 분리
  const contentParts = renderContentWithMedia(content);

  // 만약 parts가 배열이 아니면 (미디어 태그가 없으면) 일반 마크다운 렌더링
  if (typeof contentParts === 'string') {
    return (
      <Box sx={{ '& > *:first-of-type': { mt: 0 } }}>
        <ReactMarkdown
          components={components}
          rehypePlugins={[rehypeRaw]}
        >
          {contentParts}
        </ReactMarkdown>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ '& > *:first-of-type': { mt: 0 } }}>
        {contentParts.map((part) => {
          if (part.type === 'markdown') {
            return (
              <Box key={part.key}>
                <ReactMarkdown
                  components={components}
                  rehypePlugins={[rehypeRaw]}
                >
                  {part.content}
                </ReactMarkdown>
              </Box>
            );
          } else if (part.type === 'media') {
            return (
              <Box key={part.key}>
                {renderMediaComponent(part.file, part.mediaType)}
              </Box>
            );
          } else if (part.type === 'broken-media') {
            return (
              <Box key={part.key}>
                {renderBrokenMediaComponent(part.mediaType, part.fileName)}
              </Box>
            );
          } else if (part.type === 'missing-media') {
            return (
              <Box key={part.key}>
                {renderMissingMediaComponent(part.mediaType, part.fileName)}
              </Box>
            );
          }
          return null;
        })}
      </Box>

      {/* 이미지 확대 모달 */}
      <Dialog
        open={imageModalOpen}
        onClose={handleCloseImageModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            boxShadow: 'none'
          }
        }}
      >
        <DialogContent sx={{ p: 1, position: 'relative' }}>
          <IconButton
            onClick={handleCloseImageModal}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
              },
              zIndex: 1
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedImage && (
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SimpleMarkdownRenderer;
