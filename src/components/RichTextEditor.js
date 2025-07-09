import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from '../utils/amplifyConfig';

const RichTextEditor = ({ value, onChange, contentId }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const quillRef = useRef(null);
  
  // Custom image handler
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      
      try {
        setUploading(true);
        const id = contentId || uuidv4();
        const fileName = `contents/images/${id}/${file.name}`;
        
        // Read file as data URL for preview
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async (e) => {
          const localUrl = e.target.result;
          
          // Insert temporary image
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection();
          
          // Check if range is null and set a default
          const insertIndex = range ? range.index : 0;
          
          quill.insertEmbed(insertIndex, 'image', localUrl);
          quill.setSelection(insertIndex + 1);
          
          try {
            // Progress callback for upload
            const onProgress = (progressPercentage) => {
              setUploadProgress(progressPercentage);
            };
            
            // Upload to S3 (or local fallback)
            const s3Url = await uploadFile(file, `contents/images/${id}/`, onProgress);
            
            // Replace temporary image with S3 image
            const delta = quill.getContents();
            const ops = delta.ops;
            
            for (let i = 0; i < ops.length; i++) {
              if (ops[i].insert && ops[i].insert.image === localUrl) {
                ops[i].insert.image = s3Url;
                quill.setContents(delta);
                break;
              }
            }
            
            // Update parent component
            onChange(quill.root.innerHTML);
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        };
      } catch (error) {
        console.error('Error handling image:', error);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    };
  };
  
  // Custom video handler
  const videoHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'video/*');
    input.click();
    
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      
      try {
        setUploading(true);
        const id = contentId || uuidv4();
        const fileName = `contents/videos/${id}/${file.name}`;
        
        // Insert placeholder for video
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        
        // Check if range is null and set a default
        const insertIndex = range ? range.index : 0;
        
        // Insert a placeholder text
        quill.insertText(insertIndex, `Uploading video: ${file.name}...`);
        const placeholderPosition = insertIndex;
        
        try {
          // Progress callback for upload
          const onProgress = (progressPercentage) => {
            setUploadProgress(progressPercentage);
          };
          
          // Upload to S3 (or local fallback)
          const s3Url = await uploadFile(file, `contents/videos/${id}/`, onProgress);
          
          // Replace placeholder with video embed
          quill.deleteText(placeholderPosition, `Uploading video: ${file.name}...`.length);
          quill.insertEmbed(placeholderPosition, 'video', s3Url);
          quill.setSelection(placeholderPosition + 1);
          
          // Update parent component
          onChange(quill.root.innerHTML);
        } catch (error) {
          console.error('Error uploading video:', error);
        }
      } catch (error) {
        console.error('Error handling video:', error);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    };
  };
  
  // Quill modules configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link'],
        ['clean']
      ],
      handlers: {
        'image': imageHandler,
        'video': videoHandler
      }
    }
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'indent',
    'link', 'image', 'video',
    'align', 'direction',
    'color', 'background',
    'code-block', 'blockquote',
    'script'
  ];
  
  return (
    <Box sx={{ 
      position: 'relative',
      '& .ql-container': {
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        backgroundColor: '#fff',
        fontFamily: 'inherit'
      },
      '& .ql-toolbar': {
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        backgroundColor: '#f8f9fa'
      },
      '& .ql-editor': {
        minHeight: '300px',
        fontSize: '16px',
        lineHeight: '1.6'
      }
    }}>
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<ImageIcon />}
          onClick={imageHandler}
          disabled={uploading}
        >
          Insert Image
        </Button>
        <Button
          variant="outlined"
          startIcon={<VideoLibraryIcon />}
          onClick={videoHandler}
          disabled={uploading}
        >
          Insert Video
        </Button>
      </Box>
      
      <ReactQuill
        ref={quillRef}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        theme="snow"
      />
      
      {uploading && (
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: 3,
          borderRadius: 2,
          boxShadow: 3
        }}>
          <CircularProgress variant="determinate" value={uploadProgress} size={60} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Uploading: {uploadProgress}%
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RichTextEditor;
