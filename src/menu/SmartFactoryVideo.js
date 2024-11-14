// SmartFactoryVideo.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const SmartFactoryVideo = () => {
    const [content, setContent] = useState('');

    useEffect(() => {
        const markdownFilePath = `/page/SmartFactory/video/1_video.md`;

        fetch(markdownFilePath)
            .then((res) => res.text())
            .then((text) => setContent(text))
            .catch((err) => console.error('Error loading markdown file:', err));
    }, []);

    return (
        <div style={{ backgroundColor: '#ffffff', color: '#000000', padding: '20px', borderRadius: '8px' }}>
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
        </div>
    );
};

export default SmartFactoryVideo;