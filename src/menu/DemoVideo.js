import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useParams } from 'react-router-dom';

const DemoVideo = ({ content }) => {
  const { id } = useParams();
  const [markdownContent, setMarkdownContent] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    const markdownFilePath = `/page/GenAI/video/${id}_video.md`;
    fetch(markdownFilePath)
      .then((res) => res.text())
      .then((text) => setMarkdownContent(text))
      .catch((err) => console.error('Error loading markdown file:', err));

    if (videoRef.current && content[id]) {
      const video = videoRef.current;
      video.src = content[id].videoUrl;
      video.preload = 'metadata';
    }
  }, [id, content]);

  const handleVideoPlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000', padding: '20px', borderRadius: '8px' }}>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{markdownContent}</ReactMarkdown>
      <video
        ref={videoRef}
        controls
        style={{ width: '100%', maxWidth: '800px' }}
        onCanPlay={handleVideoPlay}
      />
    </div>
  );
};

export default DemoVideo;
