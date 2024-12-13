import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useParams } from 'react-router-dom';

const SmartFactoryVideo = () => {
    const { id } = useParams();
    const [content, setContent] = useState('');

    useEffect(() => {
        // 마크다운 파일 경로
        const markdownFilePath = `/page/SmartFactory/video/${id}_video.md`;
        
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
                    // video 태그에 대한 커스텀 렌더링
                    video: ({node, ...props}) => (
                        <video
                            {...props}
                            controls
                            preload="metadata"
                            crossOrigin="anonymous"
                            style={{ maxWidth: '100%' }}
                            onError={(e) => console.error('Video Error:', e)}
                        >
                            {props.children}
                        </video>
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default SmartFactoryVideo;

// // SmartFactoryVideo.js
// import React, { useState, useEffect } from 'react';
// import ReactMarkdown from 'react-markdown';
// import rehypeRaw from 'rehype-raw';
// import { useParams } from 'react-router-dom';

// const SmartFactoryVideo = () => {
//     const { id } = useParams(); // URL에서 id를 가져옴
//     const [content, setContent] = useState('');

//     useEffect(() => {
//         const markdownFilePath = `/page/SmartFactory/video/${id}_video.md`;

//         fetch(markdownFilePath)
//             .then((res) => res.text())
//             .then((text) => setContent(text))
//             .catch((err) => console.error('Error loading markdown file:', err));
//     }, []);

//     return (
//         <div style={{ backgroundColor: '#ffffff', color: '#000000', padding: '20px', borderRadius: '8px' }}>
//             <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
//         </div>
//     );
// };

// export default SmartFactoryVideo;