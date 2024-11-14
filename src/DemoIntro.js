import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'; // HTML 파싱을 위한 rehype-raw 플러그인
import { useParams } from 'react-router-dom';

const DemoIntro = () => {
  const { id } = useParams(); // URL에서 id를 가져옴
  const [content, setContent] = useState('');

  useEffect(() => {
    // 해당 데모의 마크다운 파일 경로
    const markdownFilePath = `/page/GenAI/intro/${id}_intro.md`;

    // 마크다운 파일 fetch
    fetch(markdownFilePath)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error('Error loading markdown file:', err));
  }, [id]);

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000', padding: '20px', borderRadius: '8px' }}>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
    </div>
  );
};

export default DemoIntro;

// import React, { useState, useEffect } from 'react';
// import MDEditor from '@uiw/react-md-editor';
// import { useParams } from 'react-router-dom';
// import './App.css'; // CSS 파일 import

// const DemoIntro = () => {
//   const { id } = useParams(); // URL에서 id를 가져옴
//   const [content, setContent] = useState('');

//   useEffect(() => {
//     // 해당 데모의 마크다운 파일 경로
//     const markdownFilePath = `/page/intro/${id}_intro.md`;

//     // 마크다운 파일 fetch
//     fetch(markdownFilePath)
//       .then((res) => res.text())
//       .then((text) => setContent(text))
//       .catch((err) => console.error('Error loading markdown file:', err));
//   }, [id]);

//   return (
//     <div className="markdown-content">
//       <MDEditor.Markdown source={content} />
//     </div>
//   );
// };

// export default DemoIntro;