import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  IconButton,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  VideoFile,
  Image,
  InsertDriveFile,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';

const LargeFileUpload = ({ onFilesChange, maxFiles = 10, maxSize = 5 * 1024 * 1024 * 1024 }) => {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('video/')) {
      return <VideoFile color="primary" />;
    } else if (file.type.startsWith('image/')) {
      return <Image color="secondary" />;
    } else {
      return <InsertDriveFile color="action" />;
    }
  };

  const getFileTypeChip = (file) => {
    if (file.type.startsWith('video/')) {
      return <Chip label="비디오" color="primary" size="small" />;
    } else if (file.type.startsWith('image/')) {
      return <Chip label="이미지" color="secondary" size="small" />;
    } else {
      return <Chip label="파일" color="default" size="small" />;
    }
  };

  const validateFile = (file) => {
    const errors = [];
    
    // 파일 크기 검증
    if (file.size > maxSize) {
      errors.push(`파일 크기가 너무 큽니다. 최대 ${formatFileSize(maxSize)} 허용`);
    }
    
    // 파일 타입 검증 (선택적)
    const allowedTypes = [
      'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`지원하지 않는 파일 형식입니다: ${file.type}`);
    }
    
    return errors;
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setErrors([]);
    
    // 거부된 파일들 처리
    if (rejectedFiles.length > 0) {
      const newErrors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map(e => e.message).join(', ')}`
      );
      setErrors(prev => [...prev, ...newErrors]);
    }

    // 허용된 파일들 처리
    const validFiles = [];
    const fileErrors = [];

    acceptedFiles.forEach(file => {
      const validationErrors = validateFile(file);
      if (validationErrors.length > 0) {
        fileErrors.push(`${file.name}: ${validationErrors.join(', ')}`);
      } else {
        validFiles.push({
          file,
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'ready' // ready, uploading, completed, error
        });
      }
    });

    if (fileErrors.length > 0) {
      setErrors(prev => [...prev, ...fileErrors]);
    }

    // 최대 파일 수 검증
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > maxFiles) {
      setErrors(prev => [...prev, `최대 ${maxFiles}개 파일만 업로드 가능합니다.`]);
      return;
    }

    // 파일 목록 업데이트
    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    
    // 부모 컴포넌트에 파일 목록 전달
    if (onFilesChange) {
      onFilesChange(newFiles.map(f => f.file));
    }
  }, [files, maxFiles, maxSize, onFilesChange]);

  const removeFile = (fileId) => {
    const newFiles = files.filter(f => f.id !== fileId);
    setFiles(newFiles);
    
    // 업로드 진행률에서도 제거
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    
    // 부모 컴포넌트에 업데이트된 파일 목록 전달
    if (onFilesChange) {
      onFilesChange(newFiles.map(f => f.file));
    }
  };

  const clearAllFiles = () => {
    setFiles([]);
    setUploadProgress({});
    setErrors([]);
    if (onFilesChange) {
      onFilesChange([]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    multiple: true,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi'],
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  return (
    <Box>
      {/* 드래그 앤 드롭 영역 */}
      <Card
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? '파일을 여기에 놓으세요' : '대용량 파일 업로드'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            파일을 드래그하거나 클릭하여 선택하세요
          </Typography>
          <Typography variant="caption" color="text.secondary">
            최대 {formatFileSize(maxSize)} • 최대 {maxFiles}개 파일
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip label="비디오" size="small" sx={{ mr: 1 }} />
            <Chip label="이미지" size="small" sx={{ mr: 1 }} />
            <Chip label="문서" size="small" />
          </Box>
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {errors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {errors.map((error, index) => (
            <Alert key={index} severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          ))}
        </Box>
      )}

      {/* 파일 목록 */}
      {files.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                선택된 파일 ({files.length}/{maxFiles})
              </Typography>
              <Button 
                onClick={clearAllFiles} 
                color="error" 
                size="small"
                startIcon={<Delete />}
              >
                전체 삭제
              </Button>
            </Box>
            
            <List>
              {files.map((fileItem) => (
                <ListItem key={fileItem.id} divider>
                  <Box sx={{ mr: 2 }}>
                    {getFileIcon(fileItem)}
                  </Box>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" noWrap>
                          {fileItem.name}
                        </Typography>
                        {getFileTypeChip(fileItem)}
                        {fileItem.status === 'completed' && (
                          <CheckCircle color="success" fontSize="small" />
                        )}
                        {fileItem.status === 'error' && (
                          <ErrorIcon color="error" fontSize="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(fileItem.size)}
                        </Typography>
                        {uploadProgress[fileItem.id] && (
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={uploadProgress[fileItem.id].progress || 0}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {uploadProgress[fileItem.id].progress || 0}% 업로드 중...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => removeFile(fileItem.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
            
            {/* 총 파일 크기 */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                총 파일 크기: {formatFileSize(files.reduce((total, file) => total + file.size, 0))}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default LargeFileUpload;
