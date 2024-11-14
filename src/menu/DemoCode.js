import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // 스타일 선택
import rehypeRaw from 'rehype-raw'; // HTML 파싱을 위한 rehype-raw 플러그인
import { useParams } from 'react-router-dom';

const DemoCode = () => {
  const { id } = useParams(); // URL에서 id를 가져옴
  const [content, setContent] = useState('');

  useEffect(() => {
    // 해당 데모의 마크다운 파일 경로
    const markdownFilePath = `/page/GenAI/code/${id}_code.md`;

    // 마크다운 파일 fetch
    fetch(markdownFilePath)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error('Error loading markdown file:', err));
  }, [id]);

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000', padding: '20px', borderRadius: '8px' }}>
      <ReactMarkdown 
        rehypePlugins={[rehypeRaw]} 
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter style={materialDark} language={match[1]} PreTag="div" {...props}>
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default DemoCode;

// import React from 'react';
// import { useParams } from 'react-router-dom';
// import MDEditor from '@uiw/react-md-editor';

// const DemoCode = ({ content }) => {
//   const { id } = useParams();

//   return (
//     <div>
//       <h2>Demo Code</h2>
//       <MDEditor.Markdown source={content[id].code} />
//     </div>
//   );
// };

// export default DemoCode;