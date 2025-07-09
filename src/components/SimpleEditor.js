import React, { useState, useRef } from 'react';
import { Box, Button, TextField, Typography, Grid, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import VideoCameraBackIcon from '@mui/icons-material/VideoCameraBack';
import CodeIcon from '@mui/icons-material/Code';

/**
 * SimpleEditor - React Quill 기반의 간단한 WYSIWYG 에디터
 * 이미지와 비디오를, URL을 통해 쉽게 삽입할 수 있습니다.
 */
const SimpleEditor = ({ value, onChange }) => {
  const quillRef = useRef(null);
  const [mediaDialog, setMediaDialog] = useState(false);
  const [mediaType, setMediaType] = useState('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [htmlDialog, setHtmlDialog] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');

  // 에디터 모듈 구성
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
        ['link']
      ]
    }
  };

  // 미디어 삽입 다이얼로그 열기
  const handleOpenMediaDialog = (type) => {
    setMediaType(type);
    setMediaUrl('');
    setMediaDialog(true);
  };

  // HTML 코드 삽입 다이얼로그 열기
  const handleOpenHtmlDialog = () => {
    setHtmlCode('');
    setHtmlDialog(true);
  };

  // 미디어 다이얼로그 닫기
  const handleCloseMediaDialog = () => {
    setMediaDialog(false);
  };

  // HTML 다이얼로그 닫기
  const handleCloseHtmlDialog = () => {
    setHtmlDialog(false);
  };

  // 미디어 삽입
  const handleInsertMedia = () => {
    if (!mediaUrl || !quillRef.current) return;
    
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection();
    const index = range ? range.index : 0;
    
    if (mediaType === 'image') {
      // 이미지 삽입
      editor.insertEmbed(index, 'image', mediaUrl);
    } else {
      // 비디오 삽입 (HTML로 직접 삽입)
      const videoHtml = `<video controls width="100%" style="max-height: 400px;"><source src="${mediaUrl}" /></video>`;
      editor.clipboard.dangerouslyPasteHTML(index, videoHtml);
    }
    
    editor.setSelection(index + 1);
    setMediaDialog(false);
    onChange(editor.root.innerHTML);
  };

  // HTML 코드 삽입
  const handleInsertHtml = () => {
    if (!htmlCode || !quillRef.current) return;
    
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection();
    const index = range ? range.index : 0;
    
    editor.clipboard.dangerouslyPasteHTML(index, htmlCode);
    editor.setSelection(index + 1);
    setHtmlDialog(false);
    onChange(editor.root.innerHTML);
  };

  // 에디터 내용 변경 핸들러
  const handleEditorChange = (content) => {
    onChange(content);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* 미디어 관련 버튼 */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<InsertPhotoIcon />}
            onClick={() => handleOpenMediaDialog('image')}
          >
            이미지 삽입
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<VideoCameraBackIcon />}
            onClick={() => handleOpenMediaDialog('video')}
          >
            비디오 삽입
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<CodeIcon />}
            onClick={handleOpenHtmlDialog}
          >
            HTML 코드 삽입
          </Button>
        </Grid>
      </Grid>

      {/* 에디터 */}
      <Paper sx={{ p: 1 }}>
        <ReactQuill
          ref={quillRef}
          value={value}
          onChange={handleEditorChange}
          modules={modules}
          theme="snow"
          style={{ height: '300px', marginBottom: '50px' }}
        />
      </Paper>

      {/* 미디어 URL 입력 다이얼로그 */}
      <Dialog open={mediaDialog} onClose={handleCloseMediaDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {mediaType === 'image' ? '이미지 URL 입력' : '비디오 URL 입력'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {mediaType === 'image' 
              ? '삽입할 이미지의 URL을 입력하세요.'
              : '삽입할 비디오의 URL을 입력하세요. (mp4, webm 형식)'
            }
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="URL"
            fullWidth
            variant="outlined"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder={mediaType === 'image' 
              ? 'https://example.com/image.jpg' 
              : 'https://example.com/video.mp4'
            }
          />
          {mediaType === 'image' && mediaUrl && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img 
                src={mediaUrl} 
                alt="미리보기" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '200px',
                  objectFit: 'contain'
                }} 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = '/placeholder-image.png';
                  e.target.style.opacity = 0.3;
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMediaDialog}>취소</Button>
          <Button onClick={handleInsertMedia} variant="contained">삽입</Button>
        </DialogActions>
      </Dialog>

      {/* HTML 코드 입력 다이얼로그 */}
      <Dialog open={htmlDialog} onClose={handleCloseHtmlDialog} fullWidth maxWidth="sm">
        <DialogTitle>HTML 코드 삽입</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            삽입할 HTML 코드를 입력하세요.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="HTML"
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
            placeholder='<div class="custom-content">내용을 입력하세요</div>'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHtmlDialog}>취소</Button>
          <Button onClick={handleInsertHtml} variant="contained">삽입</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimpleEditor;
