import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'; // HTML 파싱을 위한 rehype-raw 플러그인
import { useParams } from 'react-router-dom';
// import './App.css'; // CSS 파일 import

const DemoArchitecture = () => {
  const { id } = useParams(); // URL에서 id를 가져옴
  const [content, setContent] = useState('');

  useEffect(() => {
    // 해당 데모의 비디오 관련 마크다운 파일 경로
    const markdownFilePath = `/page/GenAI/architecture/${id}_arc.md`;

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

export default DemoArchitecture;


// import React from 'react';
// import { useParams } from 'react-router-dom';
// import MDEditor from '@uiw/react-md-editor';

// const DemoArchitecture = ({ content }) => {
//   const { id } = useParams(); // URL에서 데모 ID 추출

//   return (
//     <div>
//       <h2>Demo Architecture</h2>
//       {/* Markdown 형식으로 아키텍처 내용 표시 */}
//       <MDEditor.Markdown source={content[id].architecture} />
//     </div>
//   );
// };

// export default DemoArchitecture;