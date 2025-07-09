import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Image as ImageIcon,
  VideoFile as VideoFileIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useContent, CATEGORIES } from '../context/ContentContextAWS';
import { useAuth } from '../context/AuthContextCognito';
import { uploadFileToS3 } from '../utils/s3Upload';
import { saveFileLocally } from '../utils/amplifyConfig';
import secureS3Service from '../services/secureS3Service';

const ContentUploadPage = () => {
  const navigate = useNavigate();
  const { addContent } = useContent();
  const { user, isContentManager } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  // 권한 체크 (리다이렉션 제거, 메시지만 표시)
  useEffect(() => {
    console.log('📝 [ContentUploadPage] 권한 체크:', { user: !!user, isContentManager: isContentManager() });
    
    if (!user) {
      console.log('⚠️ [ContentUploadPage] 로그인이 필요하지만 리다이렉션하지 않음');
      return;
    }
    
    if (!isContentManager()) {
      console.log('⚠️ [ContentUploadPage] 콘텐츠 관리자 권한 필요');
      return;
    }
  }, [user, isContentManager, navigate]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Object URL 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 생성된 Object URL들 정리
      uploadedFiles.forEach(file => {
        if (file instanceof File) {
          const objectUrl = URL.createObjectURL(file);
          URL.revokeObjectURL(objectUrl);
        }
      });
    };
  }, [uploadedFiles]);

  // 파일 업로드 처리 (보안 S3 업로드)
  const handleFileUpload = async (files) => {
    setError('');
    const newUploadedFiles = [];

    console.log(`🔒 [ContentUploadPage] ${files.length}개 파일 보안 업로드 시작`);

    for (const file of files) {
      const fileId = Date.now() + Math.random();
      
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        console.log(`🔒 [ContentUploadPage] 보안 업로드 시작: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // 파일 크기 제한 (500MB)
        if (file.size > 500 * 1024 * 1024) {
          console.warn(`⚠️ 파일이 너무 큽니다: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
          setError(`파일 "${file.name}"이 너무 큽니다 (${(file.size / 1024 / 1024).toFixed(2)}MB). 500MB 이하로 줄여주세요.`);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
          continue; // for 루프에서 다음 파일로
        }

        // 임시 콘텐츠 ID 생성 (실제 저장 시 새로 생성됨)
        const tempContentId = `temp-${Date.now()}`;
        
        // 보안 S3 업로드 사용
        const uploadResult = await secureS3Service.uploadFileSecurely(
          file, 
          tempContentId, 
          (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: progress
            }));
          }
        );

        console.log(`✅ [ContentUploadPage] 보안 업로드 완료: ${file.name}`);

        const uploadedFile = {
          ...uploadResult,
          id: fileId
        };

        newUploadedFiles.push(uploadedFile);

        // 업로드 완료 후 진행률 제거
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

      } catch (error) {
        console.error(`❌ [ContentUploadPage] 파일 업로드 실패 (${file.name}):`, error);
        setError(`파일 업로드 실패: ${file.name} - ${error.message}`);
        
        // 업로드 진행률 제거
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }

    // 업로드된 파일들을 상태에 추가
    if (newUploadedFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      console.log(`✅ [ContentUploadPage] ${newUploadedFiles.length}개 파일 보안 업로드 완료`);
    }
  };

  // Dropzone 설정 - 모든 Hook은 조건부 return 전에 호출되어야 함
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi']
    },
    maxSize: 1024 * 1024 * 1024 // 1GB
  });

  // 권한 확인 - 모든 Hook 호출 후에 조건부 return
  if (!isContentManager()) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          콘텐츠 업로드 권한이 없습니다. 관리자에게 문의하세요.
        </Alert>
      </Container>
    );
  }

  // 태그 복사
  const copyMediaTag = (file) => {
    const mediaTag = file.type.startsWith('video/') 
      ? `[video:${file.name}]`
      : `[image:${file.name}]`;
    
    navigator.clipboard.writeText(mediaTag).then(() => {
      // 간단한 피드백 (실제로는 스낵바나 토스트를 사용하는 것이 좋음)
      console.log('태그가 클립보드에 복사되었습니다:', mediaTag);
    });
  };

  // 본문에 미디어 삽입
  const insertMediaToContent = (file) => {
    const mediaTag = file.type.startsWith('video/') 
      ? `[video:${file.name}]`
      : `[image:${file.name}]`;
    
    setFormData(prev => ({
      ...prev,
      content: prev.content + '\n\n' + mediaTag + '\n\n'
    }));
  };

  // 파일 삭제
  const handleFileDelete = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // 태그 삭제
  const handleDeleteTag = (tagToDelete) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToDelete)
    }));
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 필수 필드 검증
      if (!formData.title || !formData.description || !formData.category) {
        throw new Error('제목, 설명, 카테고리는 필수 입력 사항입니다.');
      }

      console.log(`🔒 [ContentUploadPage] 보안 콘텐츠 저장 시작: ${formData.title}`);
      console.log(`📁 [ContentUploadPage] 업로드된 파일 수: ${uploadedFiles.length}`);

      // 콘텐츠 메타데이터 생성 (파일 정보 제외)
      const contentData = {
        ...formData,
        author: user?.email || user?.name || 'Unknown User'
      };

      // 보안 파일들을 File 객체로 변환 (이미 업로드된 파일들의 메타데이터 사용)
      const fileMetadata = uploadedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        s3Key: file.s3Key,
        isSecure: file.isSecure,
        contentId: file.contentId
      }));

      console.log('💾 [ContentUploadPage] 저장할 콘텐츠 데이터:', contentData);
      console.log('📁 [ContentUploadPage] 파일 메타데이터:', fileMetadata);

      // ContentContextAWS의 addContent 함수 호출 (이미 업로드된 파일들의 메타데이터 전달)
      const savedContent = await addContent(contentData, fileMetadata);
      
      console.log('✅ [ContentUploadPage] 보안 콘텐츠 저장 완료:', savedContent.id);
      setSuccess(true);

      // 성공 후 즉시 상세 페이지로 이동
      console.log('🔄 [ContentUploadPage] 상세 페이지로 리다이렉션:', `/content/${savedContent.id}`);
      navigate(`/content/${savedContent.id}`);

    } catch (error) {
      console.error('❌ [ContentUploadPage] 콘텐츠 저장 실패:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 파일 미리보기 URL 생성
  const getPreviewUrl = (file) => {
    try {
      // 이미 S3 URL이 있는 경우 (업로드 완료된 파일)
      if (file.url && (file.url.startsWith('https://') || file.url.startsWith('http://'))) {
        console.log('🔗 [ContentUploadPage] S3 URL 사용:', file.name);
        return file.url;
      }
      
      // File 객체인 경우 (새로 업로드한 파일)
      if (file instanceof File) {
        const objectUrl = URL.createObjectURL(file);
        console.log('📷 [ContentUploadPage] Object URL 생성:', file.name);
        return objectUrl;
      }
      
      // 메타데이터 객체인 경우 (이미 업로드된 파일)
      if (file.url) {
        console.log('🔗 [ContentUploadPage] 기존 URL 사용:', file.name);
        return file.url;
      }
      
      console.warn('⚠️ [ContentUploadPage] 미리보기 URL을 생성할 수 없음:', file);
      return null;
    } catch (error) {
      console.error('❌ [ContentUploadPage] 미리보기 URL 생성 실패:', error);
      return null;
    }
  };

  // 파일 미리보기 컴포넌트
  const FilePreview = ({ file }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {file.type.startsWith('image/') ? (
              <ImageIcon color="primary" sx={{ mr: 1 }} />
            ) : (
              <VideoFileIcon color="secondary" sx={{ mr: 1 }} />
            )}
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {file.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
              <Typography variant="caption" display="block" color="primary" sx={{ fontFamily: 'monospace' }}>
                태그: [{file.type.startsWith('video/') ? 'video' : 'image'}:{file.name}]
              </Typography>
            </Box>
          </Box>
          
          {file.type.startsWith('video/') && (
            <IconButton 
              size="small" 
              onClick={() => {
                const previewUrl = getPreviewUrl(file);
                if (previewUrl) {
                  window.open(previewUrl, '_blank');
                } else {
                  console.error('❌ [ContentUploadPage] 비디오 미리보기 URL 없음:', file.name);
                }
              }}
              sx={{ mr: 1 }}
              title="미리보기"
            >
              <PlayArrowIcon />
            </IconButton>
          )}
          
          <IconButton 
            size="small" 
            onClick={() => copyMediaTag(file)}
            color="secondary"
            sx={{ mr: 1 }}
            title="태그 복사"
          >
            <CopyIcon />
          </IconButton>
          
          <IconButton 
            size="small" 
            onClick={() => insertMediaToContent(file)}
            color="primary"
            sx={{ mr: 1 }}
            title="본문에 삽입"
          >
            <AddIcon />
          </IconButton>
          
          <IconButton 
            size="small" 
            onClick={() => handleFileDelete(file.id)}
            color="error"
            title="삭제"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
        
        {file.type.startsWith('image/') && (
          <Box sx={{ mt: 2 }}>
            {getPreviewUrl(file) ? (
              <img 
                src={getPreviewUrl(file)} 
                alt={file.name}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px', 
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
                onError={(e) => {
                  console.error('❌ [ContentUploadPage] 이미지 미리보기 로드 실패:', file.name);
                  e.target.style.display = 'none';
                  // 오류 메시지 표시
                  const errorDiv = document.createElement('div');
                  errorDiv.textContent = '이미지를 로드할 수 없습니다';
                  errorDiv.style.cssText = 'color: #666; font-size: 12px; text-align: center; padding: 20px;';
                  e.target.parentNode.appendChild(errorDiv);
                }}
                onLoad={() => {
                  console.log('✅ [ContentUploadPage] 이미지 미리보기 로드 성공:', file.name);
                }}
              />
            ) : (
              <Box sx={{ 
                p: 2, 
                textAlign: 'center', 
                color: 'text.secondary',
                border: '1px dashed #ccc',
                borderRadius: '4px'
              }}>
                <Typography variant="caption">
                  이미지 미리보기를 생성할 수 없습니다
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          콘텐츠가 성공적으로 업로드되었습니다! 잠시 후 상세 페이지로 이동합니다.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        새 콘텐츠 작성
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* 기본 정보 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                기본 정보
              </Typography>
              
              <TextField
                fullWidth
                label="제목 *"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="설명 *"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                margin="normal"
                multiline
                rows={3}
                required
              />
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>카테고리</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  label="카테고리"
                >
                  {Object.entries(CATEGORIES).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* 태그 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                태그
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label="태그 추가"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Button onClick={handleAddTag} variant="outlined">
                  추가
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* 파일 업로드 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                미디어 파일
              </Typography>
              
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                  mb: 2
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {isDragActive ? '파일을 여기에 놓으세요' : '파일을 드래그하거나 클릭하여 업로드'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  이미지: PNG, JPG, GIF, WebP (최대 1GB)<br/>
                  비디오: MP4, WebM, OGG, MOV, AVI (최대 1GB)
                </Typography>
                <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
                  🚀 IndexedDB 기반 대용량 파일 지원!
                </Typography>
              </Box>

              {/* 업로드 진행률 */}
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <Box key={fileId} sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    업로드 중... {progress}%
                  </Typography>
                  <LinearProgress variant="determinate" value={progress} />
                </Box>
              ))}

              {/* 업로드된 파일 목록 */}
              {uploadedFiles.map((file) => (
                <FilePreview key={file.id} file={file} />
              ))}
            </Paper>
          </Grid>

          {/* 콘텐츠 */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                콘텐츠
              </Typography>
              
              <TextField
                fullWidth
                label="콘텐츠 (마크다운 지원)"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                multiline
                rows={10}
                placeholder="마크다운 문법을 사용하여 콘텐츠를 작성하세요...&#10;&#10;미디어 삽입 방법:&#10;- 이미지: [image:파일명]&#10;- 비디오: [video:파일명]&#10;- 또는 업로드된 파일의 '+' 버튼을 클릭하세요"
                helperText="마크다운 문법을 지원합니다. 업로드한 미디어 파일은 [image:파일명] 또는 [video:파일명] 태그로 본문에 삽입할 수 있습니다."
              />
            </Paper>
          </Grid>

          {/* 제출 버튼 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                disabled={loading}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? '업로드 중...' : '콘텐츠 게시'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default ContentUploadPage;
