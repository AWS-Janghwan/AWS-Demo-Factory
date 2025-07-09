import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  Grid,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Save as SaveIcon, 
  CloudUpload as CloudUploadIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useContent } from '../context/ContentContext';
import DraggableMediaEditor from '../components/DraggableMediaEditor';
import MarkdownRenderer from '../components/MarkdownRenderer';

const EditContentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contents, updateContent, categories } = useContent();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Load content data
  useEffect(() => {
    const contentData = contents.find(c => c.id === id);
    if (contentData) {
      setTitle(contentData.title);
      setCategory(contentData.category);
      setTags(contentData.tags.join(', '));
      
      // HTML에서 마크다운으로 변환 필요 시 추가 처리
      if (contentData.content && !contentData.markdown) {
        setContent(contentData.content);
      } else {
        setContent(contentData.markdown || contentData.content || '');
      }
      
      setFiles([]);
      setInitialLoading(false);
    } else {
      setError('Content not found');
      setInitialLoading(false);
    }
  }, [id, contents]);
  
  // 미디어 업로드 처리
  const handleMediaUpload = (mediaFiles) => {
    console.log('Media files uploaded:', mediaFiles);
    // DraggableMediaEditor에서 자체적으로 미디어를 추가하므로 여기서는 추가 처리 필요 없음
  };
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': []
    },
    onDrop: (acceptedFiles) => {
      console.log('Files received for upload:', acceptedFiles);
      setFiles([...files, ...acceptedFiles]);
    }
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !category || !content) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Updating content with files:', files);
      
      await updateContent(id, {
        title,
        category,
        tags,
        content: content, // 마크다운 콘텐츠 저장
        markdown: content, // 마크다운 형식으로 저장
        files
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/content/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating content:', error);
      setError('Failed to update content. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const removeFile = (fileToRemove) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };
  
  if (initialLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading content...
        </Typography>
      </Container>
    );
  }
  
  if (error === 'Content not found') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Content not found. The content may have been deleted or you don't have permission to edit it.
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 0, mb: 4, backgroundColor: 'transparent' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Edit Content
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Update your AWS demo, tutorial, or best practice.
        </Typography>
      </Paper>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="title"
                  label="Title"
                  name="title"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 3 }}
                />
                
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Content
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  {/* 에디터 영역 */}
                  <Box sx={{ flex: 1, mb: { xs: 2, md: 0 } }}>
                    <DraggableMediaEditor
                      value={content}
                      onChange={setContent}
                      onFileUpload={handleMediaUpload}
                    />
                  </Box>
                  
                  {/* 미리보기 영역 */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Preview
                    </Typography>
                    <Card sx={{ p: 2, borderRadius: 1, bgcolor: 'background.default' }}>
                      <CardContent>
                        <MarkdownRenderer content={content} />
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => navigate(`/content/${id}`)}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Content Details
              </Typography>
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {Object.values(categories).map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                margin="normal"
                fullWidth
                id="tags"
                label="Tags (comma separated)"
                name="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                helperText="Example: aws, lambda, serverless"
                sx={{ mb: 2 }}
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Additional Files
              </Typography>
              
              <Box 
                {...getRootProps()} 
                sx={{ 
                  border: '2px dashed #ccc', 
                  borderRadius: 2, 
                  p: 3, 
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'rgba(15, 82, 186, 0.04)'
                  }
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography>
                  Drag & drop files here, or click to select files
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Images and videos supported
                </Typography>
              </Box>
              
              {files.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    New Files:
                  </Typography>
                  {files.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => removeFile(file)}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Snackbar 
        open={Boolean(error) && error !== 'Content not found'} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Content updated successfully! Redirecting...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EditContentPage;
