import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useParams } from 'react-router-dom';

const DemoVideo = ({ content }) => {
  const { id } = useParams();
  const [markdownContent, setMarkdownContent] = useState('');

  useEffect(() => {
    const markdownFilePath = `/page/GenAI/video/${id}_video.md`;
    fetch(markdownFilePath)
      .then((res) => res.text())
      .then((text) => setMarkdownContent(text))
      .catch((err) => console.error('Error loading markdown file:', err));
  }, [id]);

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000', padding: '20px', borderRadius: '8px' }}>
      <ReactMarkdown 
        rehypePlugins={[rehypeRaw]}
        components={{
          video: ({ node, ...props }) => (
            <video
              {...props}
              {...content[id]?.videoConfig}
              style={{ width: '100%', maxWidth: '800px' }}
            />
          )
        }}
      >
        {markdownContent}
      </ReactMarkdown>
    </div>
  );
};

export default DemoVideo;
