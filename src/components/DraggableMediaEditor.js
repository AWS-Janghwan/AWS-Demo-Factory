import React, { useState, useCallback, useRef, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Grid,
  Card,
  CardMedia,
  IconButton,
  Tooltip,
  Divider,
  Slider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import Draggable from 'react-draggable';
import { 
  CloudUpload as UploadIcon, 
  InsertPhoto as ImageIcon, 
  Videocam as VideoIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomInIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { uploadFileToS3 } from '../utils/s3Upload';

const DraggableMediaEditor = ({ value, onChange, onFileUpload }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const editorRef = useRef(null);
  
  // 미디어 속성 관리
  const [mediaSize, setMediaSize] = useState(50); // 퍼센트 단위로
  const [mediaAlignment, setMediaAlignment] = useState('center');
  const [mediaCaption, setMediaCaption] = useState('');

  // 드래그 관련 상태
  const [activeDrags, setActiveDrags] = useState(0);
  const [deltaPosition, setDeltaPosition] = useState({ x: 0, y: 0 });
  const [controlledPosition, setControlledPosition] = useState({ x: 0, y: 0 });

  // 마크다운 프리뷰 토글
  const [preview, setPreview] = useState('edit');

  // 마크다운 텍스트에서 미디어 요소 처리
  useEffect(() => {
    // 마크다운 텍스트에서 업로드된 미디어 정보를 파싱하여 상태 업데이트
    const extractMediaFromMarkdown = (markdown) => {
      const mediaRegex = /!\[(.*?)\]\((.*?)\)(\{(.*?)\})?/g;
      const mediaItems = [];
      let match;
      
      while ((match = mediaRegex.exec(markdown)) !== null) {
        const alt = match[1];
        const url = match[2];
        const metadataStr = match[4] || '';
        
        // 메타데이터 파싱 (width, align 등)
        const metadata = {};
        metadataStr.split(',').forEach(item => {
          const [key, val] = item.trim().split(':');
          if (key && val) metadata[key.trim()] = val.trim();
        });
        
        mediaItems.push({
          alt,
          url,
          type: url.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'image',
          width: metadata.width || '50%',
          align: metadata.align || 'center',
          caption: metadata.caption || alt
        });
      }
      
      if (JSON.stringify(mediaItems) !== JSON.stringify(uploadedMedia)) {
        setUploadedMedia(mediaItems);
      }
    };
    
    if (value) {
      extractMediaFromMarkdown(value);
    }
  }, [value, uploadedMedia]);

  // 파일 드롭존 설정
  const onDrop = useCallback((acceptedFiles) => {
    setMediaFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    setUploadError(null);
    
    // 파일 업로드 자동 실행
    handleUploadMedia(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': []
    }
  });

  // 미디어 파일 업로드 처리
  const handleUploadMedia = async (filesToUpload = mediaFiles) => {
    if (!filesToUpload.length) return;
    
    setUploading(true);
    setUploadError(null);
    
    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const fileType = file.type.startsWith('image/') ? 'images' : 'videos';
        const isVideo = file.type.startsWith('video/');
        
        // 업로드 진행률 업데이트 함수
        const updateProgress = (progress) => {
          const overall = Math.round((i * 100 + progress) / filesToUpload.length);
          setUploadProgress(overall);
        };
        
        // S3 업로드
        const result = await uploadFileToS3(file, fileType, updateProgress);
        
        // 결과 처리 (항상 객체로 반환됨)
        const fileUrl = result.url;
        const fileName = file.name;
        const isLocalFile = result.isLocal || false;
        
        // 기본 미디어 메타데이터
        const mediaMetadata = {
          width: '50%',
          align: 'center',
          caption: fileName.split('.')[0]  // 파일명에서 확장자 제거하여 기본 캡션으로 사용
        };
        
        // 마크다운 텍스트에 미디어 추가
        let mediaMarkdown = '';
        
        // 비디오인 경우 직접 video 태그 사용
        if (isVideo) {
          mediaMarkdown = `<video controls width="${mediaMetadata.width}" style="margin-bottom: 10px;">
  <source src="${fileUrl}" type="${file.type}">
  ${mediaMetadata.caption} (브라우저가 비디오 태그를 지원하지 않습니다)
</video>

*${mediaMetadata.caption}*`;
        } else {
          // 이미지인 경우 기존 마크다운 문법 사용
          mediaMarkdown = `![${mediaMetadata.caption}](${fileUrl}){width:${mediaMetadata.width},align:${mediaMetadata.align},caption:${mediaMetadata.caption}}`;
        }
        
        // 에디터 커서 위치에 미디어 삽입 또는 끝에 추가
        onChange(`${value}\n\n${mediaMarkdown}\n\n`);
        
        // 업로드된 미디어 목록에 추가
        setUploadedMedia(prev => [...prev, {
          alt: mediaMetadata.caption,
          url: fileUrl,
          type: isVideo ? 'video' : 'image',
          width: mediaMetadata.width,
          align: mediaMetadata.align,
          caption: mediaMetadata.caption,
          isLocal: isLocalFile
        }]);
      }
      
      // 업로드 후 파일 목록 초기화
      setMediaFiles([]);
      
      // 부모 컴포넌트 콜백 호출
      if (onFileUpload) {
        onFileUpload(uploadedMedia.map(media => media.url));
      }
    } catch (error) {
      console.error('Media upload error:', error);
      setUploadError(error.message || '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 미디어 편집 다이얼로그 열기
  const openMediaDialog = (media) => {
    setSelectedMedia(media);
    setMediaSize(parseInt(media.width) || 50);
    setMediaAlignment(media.align || 'center');
    setMediaCaption(media.caption || '');
    setMediaDialogOpen(true);
  };

  // 미디어 갤러리 다이얼로그 열기
  const openGalleryDialog = () => {
    setGalleryDialogOpen(true);
  };

  // 미디어 속성 업데이트 및 마크다운 업데이트
  const updateMediaInMarkdown = () => {
    if (!selectedMedia) return;
    
    // 기존 미디어 마크다운 패턴 찾기
    const mediaRegex = new RegExp(`!\\[(.*?)\\]\\(${selectedMedia.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)(\\{(.*?)\\})?`, 'g');
    
    // 새로운 미디어 메타데이터
    const newMetadata = `{width:${mediaSize}%,align:${mediaAlignment},caption:${mediaCaption}}`;
    
    // 마크다운에서 해당 미디어 업데이트
    const updatedMarkdown = value.replace(mediaRegex, `![${mediaCaption}](${selectedMedia.url})${newMetadata}`);
    
    // 상태 업데이트
    onChange(updatedMarkdown);
    
    // 다이얼로그 닫기
    setMediaDialogOpen(false);
  };

  // 마크다운에서 미디어 삭제
  const removeMediaFromMarkdown = (media) => {
    if (!media || !media.url) return;
    
    // 미디어를 포함하는 마크다운 행 전체 찾기 (줄바꿈 문자 포함)
    const mediaLineRegex = new RegExp(`!\\[.*?\\]\\(${media.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)\\{.*?\\}.*?(\\n|$)`, 'g');
    
    // 마크다운에서 해당 미디어 라인 제거
    const updatedMarkdown = value.replace(mediaLineRegex, '');
    
    // 상태 업데이트
    onChange(updatedMarkdown);
    
    // 업로드된 미디어 목록에서도 제거
    setUploadedMedia(prev => prev.filter(item => item.url !== media.url));
    
    // 선택된 미디어가 삭제 대상이면 다이얼로그 닫기
    if (selectedMedia && selectedMedia.url === media.url) {
      setMediaDialogOpen(false);
    }
  };

  // 갤러리에서 미디어 선택하여 마크다운에 추가
  const insertMediaFromGallery = (media) => {
    if (!media || !media.url) return;
    
    // 이미 마크다운에 있는지 확인
    const mediaRegex = new RegExp(`!\\[.*?\\]\\(${media.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
    if (value.match(mediaRegex)) {
      // 이미 존재하면 추가하지 않음
      setGalleryDialogOpen(false);
      return;
    }
    
    // 미디어 종류에 따라 다른 삽입 방식 사용
    let mediaMarkdown = '';
    
    if (media.type === 'video') {
      // 비디오인 경우 HTML 태그 사용
      mediaMarkdown = `<video controls width="${media.width || '50%'}" style="margin-bottom: 10px;">
  <source src="${media.url}" type="video/mp4">
  ${media.caption || 'Video'} (브라우저가 비디오 태그를 지원하지 않습니다)
</video>

*${media.caption || 'Video'}*`;
    } else {
      // 이미지인 경우 기존 마크다운 문법 사용
      mediaMarkdown = `![${media.caption || 'Image'}](${media.url}){width:${media.width || '50%'},align:${media.align || 'center'},caption:${media.caption || 'Image'}}`;
    }
    onChange(`${value}\n\n${mediaMarkdown}\n\n`);
    
    // 갤러리 다이얼로그 닫기
    setGalleryDialogOpen(false);
  };

  // 마크다운 미리보기 토글
  const togglePreview = () => {
    setPreview(preview === 'edit' ? 'preview' : 'edit');
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        콘텐츠 작성
      </Typography>
      
      {/* 에디터 도구 모음 */}
      <Box sx={{ display: 'flex', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button 
          variant="outlined" 
          startIcon={<ImageIcon />}
          onClick={openGalleryDialog}
          size="small"
        >
          미디어 갤러리
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          component="label"
          size="small"
        >
          미디어 추가
          <input
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUploadMedia(Array.from(e.target.files));
              }
            }}
          />
        </Button>
        
        <Button
          variant="outlined"
          onClick={togglePreview}
          size="small"
        >
          {preview === 'edit' ? '미리보기' : '에디터'}
        </Button>
      </Box>
      
      {/* 오류 메시지 */}
      {uploadError && (
        <Typography color="error" sx={{ mb: 2 }}>
          오류: {uploadError}
        </Typography>
      )}
      
      {/* 마크다운 에디터 */}
      <Box ref={editorRef} sx={{ mb: 2 }}>
        <MDEditor
          value={value}
          onChange={onChange}
          height={400}
          preview={preview}
          previewOptions={{
            rehypePlugins: [[rehypeSanitize], [rehypeRaw]]
          }}
        />
      </Box>
      
      {/* 드래그 앤 드롭 영역 */}
      <Paper
        {...getRootProps()}
        className="dropzone"
        sx={{
          p: 2,
          border: '2px dashed',
          borderColor: isDragActive ? 'secondary.main' : 'grey.300',
          borderRadius: 1,
          textAlign: 'center',
          cursor: 'pointer',
          mb: 2
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 40, color: 'grey.500', mb: 1 }} />
        <Typography>
          {isDragActive
            ? "여기에 파일을 놓으세요..."
            : "이미지나 동영상을 여기에 끌어다 놓거나 클릭하여 선택하세요"}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          업로드된 미디어 파일은 본문에 자동으로 삽입됩니다.
        </Typography>
      </Paper>
      
      {/* 업로드된 미디어 미리보기 */}
      {uploadedMedia.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            업로드된 미디어:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {uploadedMedia.map((media, index) => (
              <Card key={index} sx={{ width: 150, position: 'relative' }}>
                {media.type === 'image' ? (
                  <CardMedia
                    component="img"
                    height="100"
                    image={media.url}
                    alt={media.alt || `미디어 ${index + 1}`}
                    sx={{ objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => openMediaDialog(media)}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      height: 100, 
                      bgcolor: 'black', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={() => openMediaDialog(media)}
                  >
                    <VideoIcon sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                )}
                <Box sx={{ p: 1 }}>
                  <Typography variant="caption" noWrap>
                    {media.caption || media.alt || `미디어 ${index + 1}`}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Tooltip title="편집">
                      <IconButton size="small" onClick={() => openMediaDialog(media)}>
                        <ZoomInIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton size="small" onClick={() => removeMediaFromMarkdown(media)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}
      
      {/* 미디어 편집 다이얼로그 */}
      <Dialog 
        open={mediaDialogOpen} 
        onClose={() => setMediaDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>미디어 편집</DialogTitle>
        <DialogContent>
          {selectedMedia && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  {selectedMedia.type === 'image' ? (
                    <img 
                      src={selectedMedia.url} 
                      alt={selectedMedia.alt || '이미지 미리보기'}
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '400px',
                        width: `${mediaSize}%`,
                        display: 'block',
                        marginLeft: mediaAlignment === 'left' ? '0' : 
                                   mediaAlignment === 'right' ? 'auto' : 'auto',
                        marginRight: mediaAlignment === 'right' ? '0' : 
                                     mediaAlignment === 'left' ? 'auto' : 'auto',
                        marginInline: mediaAlignment === 'center' ? 'auto' : undefined
                      }}
                    />
                  ) : (
                    <video 
                      src={selectedMedia.url} 
                      controls
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '400px',
                        width: `${mediaSize}%`,
                        display: 'block',
                        marginLeft: mediaAlignment === 'left' ? '0' : 
                                   mediaAlignment === 'right' ? 'auto' : 'auto',
                        marginRight: mediaAlignment === 'right' ? '0' : 
                                     mediaAlignment === 'left' ? 'auto' : 'auto',
                        marginInline: mediaAlignment === 'center' ? 'auto' : undefined
                      }}
                    />
                  )}
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {mediaCaption}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle2" gutterBottom>
                  크기 조정
                </Typography>
                <Slider
                  value={mediaSize}
                  onChange={(_, newValue) => setMediaSize(newValue)}
                  min={10}
                  max={100}
                  step={5}
                  valueLabelDisplay="auto"
                  valueLabelFormat={value => `${value}%`}
                  sx={{ mb: 3 }}
                />
                
                <Typography variant="subtitle2" gutterBottom>
                  정렬
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  <Button 
                    variant={mediaAlignment === 'left' ? 'contained' : 'outlined'} 
                    onClick={() => setMediaAlignment('left')}
                    startIcon={<AlignLeftIcon />}
                  >
                    왼쪽
                  </Button>
                  <Button 
                    variant={mediaAlignment === 'center' ? 'contained' : 'outlined'} 
                    onClick={() => setMediaAlignment('center')}
                    startIcon={<AlignCenterIcon />}
                  >
                    가운데
                  </Button>
                  <Button 
                    variant={mediaAlignment === 'right' ? 'contained' : 'outlined'} 
                    onClick={() => setMediaAlignment('right')}
                    startIcon={<AlignRightIcon />}
                  >
                    오른쪽
                  </Button>
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  캡션
                </Typography>
                <TextField
                  fullWidth
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  placeholder="미디어 캡션 입력"
                  sx={{ mb: 3 }}
                />
                
                <Typography variant="subtitle2" gutterBottom>
                  URL
                </Typography>
                <TextField
                  fullWidth
                  value={selectedMedia.url}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ mb: 3 }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMediaDialogOpen(false)}>취소</Button>
          <Button onClick={updateMediaInMarkdown} variant="contained" color="primary">
            적용
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 미디어 갤러리 다이얼로그 */}
      <Dialog 
        open={galleryDialogOpen} 
        onClose={() => setGalleryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>미디어 갤러리</DialogTitle>
        <DialogContent>
          {uploadedMedia.length === 0 ? (
            <Typography align="center" sx={{ py: 4 }}>
              업로드된 미디어가 없습니다. 먼저 이미지나 동영상을 업로드하세요.
            </Typography>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {uploadedMedia.map((media, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Card sx={{ cursor: 'pointer' }} onClick={() => insertMediaFromGallery(media)}>
                    {media.type === 'image' ? (
                      <CardMedia
                        component="img"
                        height="140"
                        image={media.url}
                        alt={media.alt || `미디어 ${index + 1}`}
                      />
                    ) : (
                      <Box sx={{ height: 140, bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <VideoIcon sx={{ fontSize: 60, color: 'white' }} />
                      </Box>
                    )}
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2" noWrap>
                        {media.caption || media.alt || `미디어 ${index + 1}`}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGalleryDialogOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DraggableMediaEditor;
