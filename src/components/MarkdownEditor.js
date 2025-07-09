import React, { useState, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { CloudUpload as UploadIcon, InsertPhoto as ImageIcon } from '@mui/icons-material';

const MarkdownEditor = ({ value, onChange, onFileUpload }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadError, setUploadError] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    // Update files state
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
    setUploadError(null);
    
    // Create previews for images
    const newPreviews = acceptedFiles
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        name: file.name,
        url: URL.createObjectURL(file)
      }));
    
    setPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    
    // Pass files to parent component
    if (onFileUpload) {
      try {
        onFileUpload(acceptedFiles);
      } catch (error) {
        console.error('Error in file upload:', error);
        setUploadError(error.message || 'Failed to upload files');
      }
    }
    
    // Insert image references into markdown
    acceptedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const imageMarkdown = `![${file.name}](${file.name})`;
        onChange(`${value}\n\n${imageMarkdown}`);
      }
    });
  }, [value, onChange, onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'video/*': []
    }
  });

  const insertImagePlaceholder = () => {
    const imageMarkdown = '![Image description](image-url)';
    onChange(`${value}\n\n${imageMarkdown}`);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Content
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <MDEditor
          value={value}
          onChange={onChange}
          height={400}
          preview="edit"
        />
      </Box>
      
      <Box sx={{ display: 'flex', mb: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<ImageIcon />}
          onClick={insertImagePlaceholder}
          sx={{ mr: 1 }}
        >
          Insert Image
        </Button>
      </Box>
      
      {uploadError && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {uploadError}
        </Typography>
      )}
      
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
            ? "Drop the files here..."
            : "Drag 'n' drop images or videos here, or click to select files"}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Images will be inserted into your content. Videos will be available as attachments.
        </Typography>
      </Paper>
      
      {previews.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Uploaded Images:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {previews.map((preview, index) => (
              <Box
                key={index}
                component="img"
                src={preview.url}
                alt={preview.name}
                sx={{
                  width: 100,
                  height: 100,
                  objectFit: 'cover',
                  m: 0.5,
                  borderRadius: 1
                }}
              />
            ))}
          </Box>
        </Box>
      )}
      
      {files.filter(file => file.type.startsWith('video/')).length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Uploaded Videos:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {files
              .filter(file => file.type.startsWith('video/'))
              .map((file, index) => (
                <Typography key={index} variant="body2">
                  {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </Typography>
              ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MarkdownEditor;
