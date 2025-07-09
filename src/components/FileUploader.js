import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Alert,
  LinearProgress,
  Card,
  CardMedia
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import MovieIcon from '@mui/icons-material/Movie';
import DescriptionIcon from '@mui/icons-material/Description';
import { uploadFileToS3, uploadMultipleFilesToS3 } from '../utils/s3Upload';

const FileUploader = ({ onFileUploaded, fileType = 'images', maxFiles = 5, acceptedFileTypes }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bucketStatus, setBucketStatus] = useState({ checked: false, available: false });

  // S3 버킷 상태 확인
  useEffect(() => {
    const checkBucketStatus = async () => {
      try {
        const response = await fetch('/api/check-s3-bucket');
        const data = await response.json();
        setBucketStatus({ 
          checked: true, 
          available: response.ok,
          message: data.message
        });
      } catch (error) {
        console.error('Error checking bucket status:', error);
        setBucketStatus({ 
          checked: true, 
          available: false,
          message: 'Failed to check S3 bucket status. Using local storage fallback.'
        });
      }
    };
    
    checkBucketStatus();
  }, []);

  // Define accepted file types based on fileType
  const getAcceptedTypes = () => {
    if (acceptedFileTypes) return acceptedFileTypes;
    
    switch (fileType) {
      case 'images':
        return { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] };
      case 'videos':
        return { 'video/*': ['.mp4', '.webm', '.ogg', '.mov'] };
      case 'documents':
        return {
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
          'text/markdown': ['.md']
        };
      default:
        return {};
    }
  };

  // Get file icon based on file type
  const getFileIcon = (file) => {
    if (file.type && file.type.startsWith('image/')) {
      return <InsertPhotoIcon />;
    } else if (file.type && file.type.startsWith('video/')) {
      return <MovieIcon />;
    } else {
      return <DescriptionIcon />;
    }
  };

  // Handle file drop
  const onDrop = useCallback((acceptedFiles) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files.`);
      return;
    }
    
    // 파일 크기 검증
    const maxSizeMB = fileType === 'videos' ? 100 : 10; // 비디오는 100MB, 다른 파일은 10MB 제한
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    const oversizedFiles = acceptedFiles.filter(file => file.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the ${maxSizeMB}MB size limit and were not added.`);
      // 크기 제한을 초과하지 않는 파일만 추가
      const validFiles = acceptedFiles.filter(file => file.size <= maxSizeBytes);
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      return;
    }
    
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    setError('');
  }, [files, maxFiles, fileType]);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedTypes(),
    maxFiles: maxFiles - files.length,
    disabled: uploading
  });

  // Remove file from list
  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  // Remove uploaded file
  const removeUploadedFile = (index) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
    
    // Call the callback with the updated files
    if (onFileUploaded) {
      onFileUploaded(newFiles);
    }
  };

  // Handle upload progress
  const handleProgress = (progress) => {
    setUploadProgress(progress);
  };

  // Upload files to S3
  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setError('');
    setUploadProgress(0);
    
    try {
      const uploadedResults = [];
      
      // 각 파일을 개별적으로 업로드
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadFileToS3(file, fileType, (progress) => {
          // 전체 진행률 계산
          const overallProgress = Math.round((i * 100 + progress) / files.length);
          handleProgress(overallProgress);
        });
        
        // 결과가 객체인 경우 (로컬 URL) 또는 문자열인 경우 (S3 URL) 처리
        if (typeof result === 'object') {
          uploadedResults.push(result);
        } else {
          uploadedResults.push({
            url: result,
            type: file.type,
            name: file.name,
            size: file.size,
            isLocal: false
          });
        }
      }
      
      setUploadedFiles(prev => [...prev, ...uploadedResults]);
      setFiles([]);
      
      // Call the callback with the uploaded files
      if (onFileUploaded) {
        onFileUploaded([...uploadedFiles, ...uploadedResults]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setError(`Failed to upload files: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        {fileType === 'images' ? 'Upload Images' : 
         fileType === 'videos' ? 'Upload Videos' : 'Upload Documents'}
      </Typography>
      
      {!bucketStatus.checked ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Checking S3 bucket availability...
        </Alert>
      ) : !bucketStatus.available ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {bucketStatus.message || 'S3 bucket is not available. Files will be stored locally and will not persist.'}
        </Alert>
      ) : null}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          backgroundColor: isDragActive ? 'rgba(0, 0, 0, 0.04)' : 'background.paper',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          mb: 2
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        {isDragActive ? (
          <Typography>Drop the files here...</Typography>
        ) : (
          <Typography>
            Drag & drop files here, or click to select files
            {fileType === 'images' && ' (JPEG, PNG, GIF)'}
            {fileType === 'videos' && ' (MP4, WebM, MOV)'}
            {fileType === 'documents' && ' (PDF, DOC, DOCX, MD)'}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Maximum {maxFiles} files
          {fileType === 'videos' ? ' (max 100MB each)' : ' (max 10MB each)'}
        </Typography>
      </Paper>
      
      {files.length > 0 && (
        <>
          <List dense>
            {files.map((file, index) => (
              <ListItem key={index}>
                {getFileIcon(file)}
                <ListItemText 
                  primary={file.name} 
                  secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`} 
                  sx={{ ml: 2 }}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => removeFile(index)} disabled={uploading}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          
          {uploading && (
            <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {uploadProgress}% Uploaded
              </Typography>
            </Box>
          )}
          
          <Button
            variant="contained"
            color="primary"
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
            onClick={handleUpload}
            disabled={uploading}
            sx={{ mt: 2 }}
          >
            {uploading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </>
      )}
      
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Uploaded Files:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {uploadedFiles.map((file, index) => (
              <Card key={index} sx={{ width: 150, position: 'relative' }}>
                {file.type && file.type.startsWith('image/') ? (
                  <CardMedia
                    component="img"
                    height="100"
                    image={file.url}
                    alt={file.name || `File ${index + 1}`}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : file.type && file.type.startsWith('video/') ? (
                  <Box sx={{ height: 100, bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MovieIcon sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                ) : (
                  <Box sx={{ height: 100, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DescriptionIcon sx={{ fontSize: 40 }} />
                  </Box>
                )}
                <Box sx={{ p: 1 }}>
                  <Typography variant="caption" noWrap>
                    {file.name || `File ${index + 1}`}
                  </Typography>
                </Box>
                <IconButton 
                  size="small" 
                  sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,255,255,0.7)' }}
                  onClick={() => removeUploadedFile(index)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default FileUploader;
