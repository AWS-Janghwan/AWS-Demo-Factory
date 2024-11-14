import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'; // HTML 파싱을 위한 rehype-raw 플러그인
import { useParams } from 'react-router-dom';

const DemoVideo = () => {
  const { id } = useParams(); // URL에서 id를 가져옴
  const [content, setContent] = useState('');

  useEffect(() => {
    // 해당 데모의 마크다운 파일 경로
    const markdownFilePath = `/page/GenAI/video/${id}_video.md`;

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

export default DemoVideo;


// import React from 'react';
// import { useParams } from 'react-router-dom';
// import ReactPlayer from 'react-player';

// const DemoVideo = ({ content }) => {
//   const { id } = useParams(); // URL에서 데모 ID 추출

//   return (
//     <div>
//       <h2>Demo Video</h2>
//       {/* ReactPlayer로 비디오 재생 */}
//       <ReactPlayer url={content[id].videoUrl} controls width="800px" height="450px" />
//     </div>
//   );
// };

// export default DemoVideo;