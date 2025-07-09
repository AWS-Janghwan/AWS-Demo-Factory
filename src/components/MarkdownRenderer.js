import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import rehypeRaw from 'rehype-raw';
import ReactPlayer from 'react-player';
import { 
  Box, 
  Typography, 
  Link, 
  Paper,
  Divider
} from '@mui/material';

// 정규식을 사용하여 이미지/비디오 마크다운에서 메타데이터 추출
const parseMediaMeta = (alt, src) => {
  const metadata = {
    width: '100%',
    align: 'center',
    caption: alt || '',
    isVideo: false
  };
  
  if (src) {
    if (src.match(/\.(mp4|webm|ogg|mov|avi)$/i)) {
      metadata.isVideo = true;
    }
  }
  
  return metadata;
};

const MarkdownRenderer = ({ content, files = [] }) => {
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    if (!content) {
      setProcessedContent('');
      return;
    }

    console.log('=== MarkdownRenderer 디버깅 ===');
    console.log('전달받은 Files:', files);
    console.log('전달받은 Content:', content);
    
    // 파일 정보 상세 출력
    files.forEach((file, index) => {
      console.log(`파일 ${index}:`, {
        name: file.name,
        type: file.type,
        url: file.url,
        size: file.size
      });
    });

    // 커스텀 미디어 태그를 마크다운 이미지/비디오 태그로 변환
    let processed = content;

    // [media:파일명], [video:파일명], [image:파일명] 태그 처리
    const mediaRegex = /\[(media|video|image):([^\]]+)\]/g;
    let match;
    const foundTags = [];
    
    // 먼저 모든 태그를 찾아서 로그 출력
    while ((match = mediaRegex.exec(content)) !== null) {
      foundTags.push({
        fullMatch: match[0],
        type: match[1],
        fileName: match[2].trim()
      });
    }
    
    console.log('찾은 미디어 태그들:', foundTags);
    
    // 실제 변환 처리
    processed = content.replace(/\[(media|video|image):([^\]]+)\]/g, (match, type, fileName) => {
      const trimmedFileName = fileName.trim();
      console.log(`\n🔍 === 태그 처리 시작 ===`);
      console.log(`원본 태그: ${match}`);
      console.log(`타입: ${type}`);
      console.log(`찾는 파일명: "${trimmedFileName}"`);
      console.log(`사용 가능한 파일들:`, files.map(f => ({ name: f.name, url: f.url?.substring(0, 50) + '...' })));
      
      // 파일 찾기 - 여러 방법으로 시도
      const file = files.find(f => {
        const exactMatch = f.name === trimmedFileName;
        const caseInsensitiveMatch = f.name.toLowerCase() === trimmedFileName.toLowerCase();
        const partialMatch = f.name.includes(trimmedFileName);
        const reversePartialMatch = trimmedFileName.includes(f.name);
        const extensionlessMatch = f.name.split('.')[0] === trimmedFileName.split('.')[0];
        
        console.log(`파일 "${f.name}" 매칭 시도:`, {
          exactMatch,
          caseInsensitiveMatch,
          partialMatch,
          reversePartialMatch,
          extensionlessMatch,
          fileUrl: f.url?.substring(0, 30) + '...'
        });
        
        return exactMatch || caseInsensitiveMatch || partialMatch || reversePartialMatch || extensionlessMatch;
      });
      
      if (file) {
        console.log(`✅ 매칭된 파일 전체 정보:`, file);
        
        // URL 검증 및 복구
        let fileUrl = file.url;
        console.log(`원본 파일 URL: "${fileUrl}"`);
        
        if (!fileUrl || fileUrl.trim() === '') {
          console.error(`❌ 파일 URL이 비어있음, 복구 시도`);
          
          // localStorage에서 로컬 파일 찾기 시도
          const localFiles = JSON.parse(localStorage.getItem('localFiles') || '[]');
          console.log(`localStorage 파일들:`, localFiles);
          
          const localFile = localFiles.find(lf => lf.name === file.name);
          
          if (localFile && localFile.url) {
            console.log(`✅ localStorage에서 URL 복구: "${localFile.url}"`);
            fileUrl = localFile.url;
          } else {
            console.error(`❌ localStorage에서도 URL을 찾을 수 없음`);
            
            // 최후의 수단: 에러 메시지 대신 재업로드 안내
            return `\n\n**⚠️ 미디어 파일 재업로드 필요**\n\n파일명: \`${trimmedFileName}\`\n\n이 파일의 URL이 손실되었습니다. 콘텐츠를 수정하여 파일을 다시 업로드해주세요.\n\n`;
          }
        }
        
        // 최종 URL 검증
        if (!fileUrl || fileUrl.trim() === '') {
          console.error(`❌ 최종 URL 검증 실패: "${fileUrl}"`);
          return `\n\n**❌ URL 생성 실패: ${trimmedFileName}**\n\n`;
        }
        
        const markdownTag = `![${file.name}](${fileUrl})`;
        console.log(`✅ 최종 생성된 마크다운: "${markdownTag}"`);
        console.log(`🔍 === 태그 처리 완료 ===\n`);
        return markdownTag;
      } else {
        console.log(`❌ 파일을 찾을 수 없음: "${trimmedFileName}"`);
        console.log('🔍 === 태그 처리 완료 (실패) ===\n');
        return `\n\n**파일을 찾을 수 없음: ${trimmedFileName}**\n\n`;
      }
    });

    console.log('최종 처리된 콘텐츠:', processed);
    console.log('=== 디버깅 끝 ===\n');
    
    setProcessedContent(processed);
  }, [content, files]);

  const components = {
    // 코드 블록 렌더링
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <Box sx={{ my: 2 }}>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </Box>
      ) : (
        <Box
          component="code"
          sx={{
            backgroundColor: 'grey.100',
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            fontFamily: 'monospace',
            fontSize: '0.875em'
          }}
          {...props}
        >
          {children}
        </Box>
      );
    },

    // 이미지/비디오 렌더링
    img({ src, alt, ...props }) {
      console.log('이미지 렌더링 시도:', { src, alt });
      
      // 빈 URL 처리
      if (!src || src.trim() === '') {
        console.error('빈 이미지 URL:', { src, alt });
        return (
          <Box sx={{ my: 2, p: 2, border: '1px dashed red', textAlign: 'center' }}>
            <Typography color="error">
              이미지 URL이 없습니다: {alt}
            </Typography>
          </Box>
        );
      }
      
      const metadata = parseMediaMeta(alt, src);
      
      if (metadata.isVideo) {
        console.log('비디오로 렌더링:', src);
        return (
          <Box sx={{ my: 2, textAlign: metadata.align }}>
            <ReactPlayer
              url={src}
              controls
              width={metadata.width}
              height="auto"
              style={{ maxWidth: '100%' }}
              onError={(error) => console.error('비디오 재생 오류:', error)}
            />
            {metadata.caption && (
              <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                {metadata.caption}
              </Typography>
            )}
          </Box>
        );
      }

      console.log('이미지로 렌더링:', src);
      return (
        <Box sx={{ my: 2, textAlign: metadata.align }}>
          <img
            src={src}
            alt={alt}
            style={{
              width: metadata.width,
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onError={(e) => {
              console.error('이미지 로드 오류:', src);
              console.error('Error event:', e);
            }}
            onLoad={() => console.log('이미지 로드 성공:', src)}
            {...props}
          />
          {metadata.caption && (
            <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
              {metadata.caption}
            </Typography>
          )}
        </Box>
      );
    },

    // 제목 렌더링
    h1: ({ children }) => (
      <Typography variant="h3" component="h1" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),
    h2: ({ children }) => (
      <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),
    h3: ({ children }) => (
      <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 3, mb: 1.5, fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),
    h4: ({ children }) => (
      <Typography variant="h6" component="h4" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),

    // 문단 렌더링
    p: ({ children }) => (
      <Typography variant="body1" paragraph sx={{ lineHeight: 1.7, mb: 2 }}>
        {children}
      </Typography>
    ),

    // 링크 렌더링
    a: ({ href, children }) => (
      <Link href={href} target="_blank" rel="noopener noreferrer" color="primary">
        {children}
      </Link>
    ),

    // 리스트 렌더링
    ul: ({ children }) => (
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        {children}
      </Box>
    ),
    ol: ({ children }) => (
      <Box component="ol" sx={{ pl: 3, mb: 2 }}>
        {children}
      </Box>
    ),
    li: ({ children }) => (
      <Typography component="li" variant="body1" sx={{ mb: 0.5, lineHeight: 1.6 }}>
        {children}
      </Typography>
    ),

    // 인용문 렌더링
    blockquote: ({ children }) => (
      <Paper
        elevation={0}
        sx={{
          borderLeft: 4,
          borderColor: 'primary.main',
          backgroundColor: 'grey.50',
          p: 2,
          my: 2,
          fontStyle: 'italic'
        }}
      >
        {children}
      </Paper>
    ),

    // 구분선 렌더링
    hr: () => <Divider sx={{ my: 3 }} />,

    // 테이블 렌더링
    table: ({ children }) => (
      <Box sx={{ overflowX: 'auto', my: 2 }}>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          {children}
        </Box>
      </Box>
    ),
    th: ({ children }) => (
      <Box
        component="th"
        sx={{
          border: 1,
          borderColor: 'divider',
          p: 1,
          backgroundColor: 'grey.100',
          fontWeight: 'bold',
          textAlign: 'left'
        }}
      >
        {children}
      </Box>
    ),
    td: ({ children }) => (
      <Box
        component="td"
        sx={{
          border: 1,
          borderColor: 'divider',
          p: 1
        }}
      >
        {children}
      </Box>
    )
  };

  if (!processedContent) {
    return (
      <Typography variant="body2" color="text.secondary" fontStyle="italic">
        콘텐츠가 없습니다.
      </Typography>
    );
  }

  return (
    <Box sx={{ '& > *:first-of-type': { mt: 0 } }}>
      <ReactMarkdown
        components={components}
        rehypePlugins={[rehypeRaw]}
      >
        {processedContent}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;
