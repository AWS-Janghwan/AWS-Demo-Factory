// SmartFactoryIntro.js
// import React, { useState, useEffect } from 'react';
// import ReactMarkdown from 'react-markdown';
// import rehypeRaw from 'rehype-raw';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'; // HTML 파싱을 위한 rehype-raw 플러그인
import { useParams } from 'react-router-dom';


const SmartFactoryIntro = () => {
    const { id } = useParams(); // URL에서 id를 가져옴
    const [content, setContent] = useState('');

    useEffect(() => {
        // SmartFactory 경로의 마크다운 파일
        const markdownFilePath = `/page/SmartFactory/intro/${id}_intro.md`;

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

export default SmartFactoryIntro;