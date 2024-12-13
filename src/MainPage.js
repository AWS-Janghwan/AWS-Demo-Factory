import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useParams } from 'react-router-dom';
import './App.css';

const MainPage = () => {
  const { id } = useParams();
  const [content, setContent] = useState('');
  const [videoLoaded, setVideoLoaded] = useState(false);

  // 비디오 프리로딩 설정
  const videoConfig = {
    hlsConfig: {
      enableWorker: true,
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      backBufferLength: 90
    }
  };

  useEffect(() => {
    // 마크다운 파일 로드
    const markdownFilePath = `/page/main/main.md`;
    fetch(markdownFilePath)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error('Error loading markdown file:', err));

    // 비디오 프리로딩
    const preloadVideos = () => {
      const videos = [
        '/source/movie/GenAI_MES-Chatbot.mp4',
        '/source/movie/GenAI_Aveva_PI.mp4',
        '/source/movie/SF_DDI.mp4',
        '/source/movie/SF_Smart_Fire_Detection_Reporting.mp4'
      ];

      videos.forEach(videoUrl => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'video';
        link.href = videoUrl;
        link.onload = () => setVideoLoaded(true);
        document.head.appendChild(link);
      });
    };

    preloadVideos();
  }, [id]);

  // 비디오 플레이어 설정
  const VideoPlayer = ({ src }) => {
    const videoRef = React.useRef(null);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.addEventListener('loadedmetadata', () => {
          videoRef.current.play();
        });
      }
    }, []);

    return (
      <video
        ref={videoRef}
        controls
        preload="auto"
        style={{ width: '100%', maxWidth: '800px' }}
        {...videoConfig}
      />
    );
  };

  return (
    <div style={{ 
      backgroundColor: '#ffffff', 
      color: '#000000', 
      padding: '20px', 
      borderRadius: '8px' 
    }}>
      <ReactMarkdown 
        rehypePlugins={[rehypeRaw]}
        components={{
          video: ({ node, ...props }) => (
            <VideoPlayer {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MainPage;
