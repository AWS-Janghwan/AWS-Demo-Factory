
// src/components/VideoPlayer.js
import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js/dist/hls.min';

const VideoPlayer = ({ src }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (Hls.isSupported()) {
      const hls = new Hls({
        startLevel: 0,  // 초기 화질 최적화
        maxBufferLength: 30,
        maxMaxBufferLength: 600
      });
      
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);
    }
  }, [src]);

  return (
    <video 
      ref={videoRef} 
      controls 
      style={{ width: '100%', maxWidth: '800px' }}
    />
  );
};

export default VideoPlayer;
