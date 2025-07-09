import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider
} from '@mui/material';
import { 
  Save as SaveIcon, 
  CloudUpload as CloudUploadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import RichTextEditor from '../components/RichTextEditor';

const CreateContentPage = () => {
  const navigate = useNavigate();
  const { addContent, categories } = useContent();
  const { currentUser, hasPermission } = useAuth();
  
  // 권한 체크 (리다이렉션 제거, 메시지만 표시)
  useEffect(() => {
    console.log('📝 [CreateContentPage] 권한 체크:', { currentUser: !!currentUser });
    
    if (!currentUser) {
      console.log('⚠️ [CreateContentPage] 로그인이 필요하지만 리다이렉션하지 않음');
      return;
    }
    
    if (!hasPermission('content_create')) {
      alert('콘텐츠 생성 권한이 없습니다. 컨텐츠 업로더(Contributor) 계정이 필요합니다.');
      navigate('/');
      return;
    }
  }, [currentUser, hasPermission, navigate]);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
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
      console.log('Submitting content with files:', files);
      
      const newContent = await addContent({
        title,
        category,
        tags,
        markdown: content,
        files
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/content/${newContent.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error creating content:', error);
      setError('Failed to create content. Please try again.');
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
          Create New Content
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Share your AWS demo, tutorial, or best practice with the community.
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
                
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                />
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Saving...' : 'Save Content'}
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
                    Selected Files:
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
          
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tips
              </Typography>
              <Typography variant="body2" paragraph>
                • Use clear, descriptive titles
              </Typography>
              <Typography variant="body2" paragraph>
                • Include step-by-step instructions
              </Typography>
              <Typography variant="body2" paragraph>
                • Add relevant tags for better discoverability
              </Typography>
              <Typography variant="body2">
                • Upload screenshots or diagrams to illustrate your content
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Snackbar 
        open={Boolean(error)} 
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
          Content created successfully! Redirecting...
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateContentPage;
