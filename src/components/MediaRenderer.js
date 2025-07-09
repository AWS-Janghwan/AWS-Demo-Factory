import React from 'react';
import { Box, Typography, Card, CardMedia, IconButton } from '@mui/material';
import { PlayArrow as PlayArrowIcon, Image as ImageIcon } from '@mui/icons-material';
import ReactPlayer from 'react-player';

const MediaRenderer = ({ content, files = [] }) => {
  // 미디어 태그를 찾아서 실제 미디어로 교체하는 함수
  const renderContentWithMedia = (text) => {
    if (!text || !files.length) return text;

    // 미디어 태그 패턴: [image:filename] 또는 [video:filename]
    const mediaTagPattern = /\[(image|video):([^\]]+)\]/g;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mediaTagPattern.exec(text)) !== null) {
      // 태그 이전의 텍스트 추가
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
          key: `text-${lastIndex}`
        });
      }

      const [fullMatch, mediaType, fileName] = match;
      
      // 파일 목록에서 해당 파일 찾기
      const mediaFile = files.find(file => 
        file.name === fileName || 
        file.name.includes(fileName) ||
        fileName.includes(file.name)
      );

      if (mediaFile) {
        parts.push({
          type: 'media',
          mediaType,
          file: mediaFile,
          key: `media-${match.index}`
        });
      } else {
        // 파일을 찾을 수 없으면 원본 태그 유지
        parts.push({
          type: 'text',
          content: fullMatch,
          key: `missing-${match.index}`
        });
      }

      lastIndex = match.index + fullMatch.length;
    }

    // 마지막 부분의 텍스트 추가
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
        key: `text-${lastIndex}`
      });
    }

    return parts;
  };

  const renderMediaComponent = (file, mediaType) => {
    if (mediaType === 'image') {
      return (
        <Card sx={{ maxWidth: '100%', mb: 2 }}>
          <CardMedia
            component="img"
            image={file.url}
            alt={file.name}
            sx={{
              maxHeight: 400,
              objectFit: 'contain',
              width: '100%'
            }}
          />
          <Box sx={{ p: 1, backgroundColor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              {file.name}
            </Typography>
          </Box>
        </Card>
      );
    } else if (mediaType === 'video') {
      return (
        <Card sx={{ maxWidth: '100%', mb: 2 }}>
          <Box sx={{ position: 'relative', paddingTop: '56.25%' /* 16:9 aspect ratio */ }}>
            <ReactPlayer
              url={file.url}
              width="100%"
              height="100%"
              style={{ position: 'absolute', top: 0, left: 0 }}
              controls
              config={{
                file: {
                  attributes: {
                    controlsList: 'nodownload'
                  }
                }
              }}
            />
          </Box>
          <Box sx={{ p: 1, backgroundColor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary">
              {file.name}
            </Typography>
          </Box>
        </Card>
      );
    }
    return null;
  };

  const contentParts = renderContentWithMedia(content);

  // 만약 parts가 배열이 아니면 (미디어 태그가 없으면) 원본 텍스트 반환
  if (typeof contentParts === 'string') {
    return contentParts;
  }

  return (
    <Box>
      {contentParts.map((part) => {
        if (part.type === 'text') {
          return <span key={part.key}>{part.content}</span>;
        } else if (part.type === 'media') {
          return (
            <Box key={part.key} sx={{ my: 2 }}>
              {renderMediaComponent(part.file, part.mediaType)}
            </Box>
          );
        }
        return null;
      })}
    </Box>
  );
};

export default MediaRenderer;
