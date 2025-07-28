import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { uploadFileSecurely } from '../services/backendUploadService';

const ContentEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getContentById, updateContent } = useContent();
  const { user, isContentManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
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

  // 디버깅을 위한 formData 변경 감지 (최적화됨) - 필요시에만 활성화
  // useEffect(() => {
  //   console.log('📊 formData 변경됨:', {
  //     title: formData.title?.substring(0, 20) + '...',
  //     description: formData.description?.substring(0, 20) + '...',
  //     content: formData.content?.substring(0, 50) + '...',
  //     category: formData.category,
  //     tags: formData.tags
  //   });
  // }, [formData.title, formData.description, formData.content, formData.category, formData.tags]);
  const [tagInput, setTagInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [originalContent, setOriginalContent] = useState(null);
  
  // 본문 textarea ref
  const contentTextareaRef = useRef(null);

  // 권한 체크 함수 (useCallback으로 메모이제이션)
  const canEditContent = useCallback((content) => {
    if (!user || !content) return false;
    
    // 관리자는 모든 콘텐츠 수정 가능
    if (isContentManager()) return true;
    
    // 작성자는 자신의 콘텐츠만 수정 가능
    return content.author === user.email || content.author === user.name;
  }, [user, isContentManager]);

  // 콘텐츠 로드 함수 (useCallback으로 메모이제이션)
  const loadContent = useCallback(async () => {
    try {
      console.log('🔍 [ContentEditPage] 콘텐츠 로드 시작, ID:', id);
      const content = getContentById(id); // parseInt 제거 - 문자열 ID 지원
      console.log('📄 [ContentEditPage] 로드된 콘텐츠:', content);
      
      if (!content) {
        console.error('❌ [ContentEditPage] 콘텐츠를 찾을 수 없음:', id);
        setError('콘텐츠를 찾을 수 없습니다.');
        return;
      }

      if (!canEditContent(content)) {
        console.error('❌ [ContentEditPage] 수정 권한 없음:', content.title);
        setError('이 콘텐츠를 수정할 권한이 없습니다.');
        return;
      }

      console.log('📄 [ContentEditPage] 원본 콘텐츠 로드됨:', content);
      console.log('📝 [ContentEditPage] 원본 콘텐츠 본문 길이:', (content.content || '').length, '글자');
      
      setOriginalContent(content);
      const initialFormData = {
        title: content.title || '',
        description: content.description || '',
        content: content.content || '',
        category: content.category || '',
        tags: content.tags || []
      };
      
      console.log('📝 [ContentEditPage] 초기 formData 설정:', initialFormData);
      console.log('📝 [ContentEditPage] 초기 formData.content 길이:', initialFormData.content.length, '글자');
      
      setFormData(initialFormData);
      setUploadedFiles(content.files || []);
    } catch (error) {
      console.error('콘텐츠 로드 실패:', error);
      setError('콘텐츠를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id, getContentById, canEditContent]);

  // 콘텐츠 로드
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // 파일 업로드 처리
  const handleFileUpload = async (files) => {
    setError('');
    const newUploadedFiles = [];

    for (const file of files) {
      try {
        const fileId = Date.now() + Math.random();
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        // 파일 타입 결정
        const fileType = file.type.startsWith('image/') ? 'images' : 
                        file.type.startsWith('video/') ? 'videos' : 'documents';

        let fileUrl;
        let isLocal = false;

        console.log(`📁 파일 업로드 시작: ${file.name}`);

        try {
          // 백엔드를 통한 안전한 업로드
          const result = await uploadFileSecurely(file, id, (progress) => {
            setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          });
          
          // 백엔드 업로드 서비스 응답 처리
          if (result && typeof result === 'object') {
            // 백엔드 스트리밍 URL 사용
            fileUrl = `http://localhost:3001/api/s3/file/${encodeURIComponent(result.s3Key)}`;
            console.log('✅ S3 업로드 성공, 스트리밍 URL 생성:', fileUrl);
          } else if (typeof result === 'string') {
            fileUrl = result;
            console.log('✅ S3 업로드 성공:', fileUrl);
          } else {
            throw new Error('예상치 못한 업로드 결과 형식');
          }
        } catch (s3Error) {
          console.warn('⚠️ S3 업로드 실패, 로컬 URL 생성:', s3Error);
          isLocal = true;
        }

        // S3 실패 시 또는 URL이 비어있을 때 로컬 blob URL 생성
        if (isLocal || !fileUrl || (typeof fileUrl === 'string' && fileUrl.trim() === '')) {
          console.log('🔄 로컬 blob URL 생성 중...');
          fileUrl = URL.createObjectURL(file);
          isLocal = true;
          console.log('✅ 로컬 blob URL 생성:', fileUrl);
        }

        // 최종 URL 검증
        if (!fileUrl || (typeof fileUrl === 'string' && fileUrl.trim() === '')) {
          console.error('❌ 파일 URL 생성 완전 실패');
          throw new Error(`파일 URL 생성 실패: ${file.name}`);
        }

        console.log(`🎯 최종 파일 URL (${file.name}):`, fileUrl);

        const uploadedFile = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: fileUrl,
          isLocal: isLocal,
          uploadedAt: new Date().toISOString(),
          verified: true // URL 검증 완료 표시
        };

        newUploadedFiles.push(uploadedFile);
        
        // 로컬 파일인 경우 localStorage에도 저장
        if (isLocal) {
          const localFiles = JSON.parse(localStorage.getItem('localFiles') || '[]');
          localFiles.push({
            id: fileId,
            name: file.name,
            url: fileUrl,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
          });
          localStorage.setItem('localFiles', JSON.stringify(localFiles));
        }
        
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

      } catch (error) {
        console.error('File upload error:', error);
        setError(`파일 업로드 실패: ${file.name} - ${error.message}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
  };

  // Dropzone 설정
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi']
    },
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  // 태그 복사
  const copyMediaTag = (file) => {
    const mediaTag = file.type.startsWith('video/') 
      ? `[video:${file.name}]`
      : `[image:${file.name}]`;
    
    navigator.clipboard.writeText(mediaTag).then(() => {
      console.log('태그가 클립보드에 복사되었습니다:', mediaTag);
    });
  };

  // 커서 위치에 미디어 삽입
  const insertMediaToContent = (file) => {
    const mediaTag = file.type.startsWith('video/') 
      ? `[video:${file.name}]`
      : `[image:${file.name}]`;
    
    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content;
      
      // 커서 위치에 미디어 태그 삽입
      const newContent = 
        currentContent.substring(0, start) + 
        '\n' + mediaTag + '\n' + 
        currentContent.substring(end);
      
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
      
      // 커서 위치를 삽입된 텍스트 뒤로 이동
      setTimeout(() => {
        const newCursorPos = start + mediaTag.length + 2; // \n + mediaTag + \n
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
      
      console.log(`✅ 커서 위치에 미디어 삽입 완료: ${mediaTag}`);
    } else {
      // fallback: textarea ref가 없으면 기존 방식 사용
      setFormData(prev => ({
        ...prev,
        content: prev.content + '\n\n' + mediaTag + '\n\n'
      }));
    }
  };

  // 파일 삭제
  const handleFileDelete = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // 태그 추가
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
    console.log('🚀 [ContentEditPage] 폼 제출 시작');
    setSaving(true);
    setError('');

    try {
      console.log('📝 [ContentEditPage] 현재 formData:', {
        title: formData.title,
        description: formData.description,
        content: `"${formData.content}" (${formData.content.length}글자)`,
        category: formData.category,
        tags: formData.tags
      });
      console.log('📁 [ContentEditPage] 업로드된 파일:', uploadedFiles);
      console.log('📄 [ContentEditPage] 원본 콘텐츠:', originalContent);

      // 필수 필드 검증
      if (!formData.title || !formData.description || !formData.category) {
        throw new Error('제목, 설명, 카테고리는 필수 입력 사항입니다.');
      }

      // 콘텐츠 업데이트 (id와 createdAt 제외)
      const { id: excludeId, createdAt, ...contentWithoutKeys } = originalContent;
      const updatedContent = {
        ...contentWithoutKeys,
        ...formData,
        files: uploadedFiles,
        updatedAt: new Date().toISOString()
      };

      console.log('💾 [ContentEditPage] 업데이트할 콘텐츠:', {
        ...updatedContent,
        content: `"${updatedContent.content}" (${updatedContent.content.length}글자)`
      });
      console.log('🔢 [ContentEditPage] 콘텐츠 ID:', originalContent.id);
      console.log('🔍 [ContentEditPage] 제외된 필드들: id, createdAt');

      updateContent(originalContent.id, updatedContent);
      
      console.log('✅ [ContentEditPage] updateContent 호출 완료');
      setSuccess(true);

      // 성공 후 상세 페이지로 이동
      setTimeout(() => {
        console.log('🔄 [ContentEditPage] 페이지 이동:', `/content/${originalContent.id}`);
        navigate(`/content/${originalContent.id}`);
      }, 2000);

    } catch (error) {
      console.error('❌ [ContentEditPage] 폼 제출 에러:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // 권한 없음 또는 콘텐츠 없음
  if (error && !originalContent) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate('/')} variant="contained">
          홈으로 돌아가기
        </Button>
      </Container>
    );
  }

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
              onClick={() => window.open(file.url, '_blank')}
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
            <img 
              src={file.url} 
              alt={file.name}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '200px', 
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          콘텐츠가 성공적으로 수정되었습니다! 잠시 후 상세 페이지로 이동합니다.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        콘텐츠 수정
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
                  이미지: PNG, JPG, GIF, WebP (최대 100MB)<br/>
                  비디오: MP4, WebM, OGG, MOV, AVI (최대 100MB)
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
                onChange={(e) => {
                  console.log('📝 [ContentEditPage] 콘텐츠 변경 감지:', e.target.value.length, '글자');
                  console.log('📝 [ContentEditPage] 변경된 내용 미리보기:', e.target.value.substring(0, 100) + '...');
                  setFormData(prev => {
                    const newFormData = { ...prev, content: e.target.value };
                    console.log('📝 [ContentEditPage] 새로운 formData.content:', newFormData.content.length, '글자');
                    return newFormData;
                  });
                }}
                inputRef={contentTextareaRef}
                multiline
                rows={10}
                placeholder="마크다운 문법을 사용하여 콘텐츠를 작성하세요...&#10;&#10;미디어 삽입 방법:&#10;- 이미지: [image:파일명]&#10;- 비디오: [video:파일명]&#10;- 또는 업로드된 파일의 '+' 버튼을 클릭하여 커서 위치에 삽입하세요"
                helperText="마크다운 문법을 지원합니다. '+' 버튼을 클릭하면 커서 위치에 미디어 태그가 삽입됩니다."
              />
            </Paper>
          </Grid>

          {/* 제출 버튼 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/content/${originalContent.id}`)}
                disabled={saving}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={saving && <CircularProgress size={20} />}
              >
                {saving ? '저장 중...' : '수정 완료'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default ContentEditPage;
