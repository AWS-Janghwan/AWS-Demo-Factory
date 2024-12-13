import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw'; // HTML 파싱을 위한 rehype-raw 플러그인
import { useParams } from 'react-router-dom';
import './App.css'; // CSS 파일 import


// const MainPage = () => {

//     const markdownContent = `


// # AWS Demo Factory 소개

// AWS Demo Factory는 고객들의 AWS 서비스 이해도를 높이고 실제 서비스를 구현하는 능력을 향상시키기 위해 기획된 플랫폼입니다.  
// 이 플랫폼은 다양한 AWS 서비스에 대한 데모 영상, 실습 자료, 실제 구현 가능한 아키텍처 자료를 제공하여 고객들이 자신의 비즈니스 요구사항에 맞는 AWS 솔루션을 쉽게 검색하고 적용할 수 있도록 합니다.

// AWS Demo Factory는 제조 고객을 대상으로 AWS 서비스를 활용한 다양한 사례를 소개하는 데모 영상, 핸즈온 자료, 데모 아키텍처를 단일 웹 서비스에 통합하여 제공합니다.  
// 이를 통해 고객들이 제조업 분야에서 AWS 서비스를 활용하여 얻을 수 있는 다양한 비즈니스 가치를 쉽게 확인하고 이해할 수 있습니다. 또한 스마트 팩토리, 지속 가능성, 스마트 엔지니어링 등 제조업 전반에 걸친 다양한 사례를 포괄적으로 다루어 고객의 니즈를 충족시킬 수 있도록 합니다.


// `;

const MainPage = () => {
    const { id } = useParams(); // URL에서 id를 가져옴
    const [content, setContent] = useState('');
  
    useEffect(() => {
      // 해당 데모의 비디오 관련 마크다운 파일 경로
      const markdownFilePath = `/page/main/main.md`;
  
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

// 스타일 정의
// const styles = {
//   container: {
//     backgroundColor: '#ffffff', // 흰색 배경
//     padding: '20px',
//     fontFamily: 'Arial, sans-serif',
//   },
//   markdown: {
//     whiteSpace: 'pre-wrap',
//     backgroundColor: '#ffffff', // 마크다운 배경을 흰색으로 설정
//     color: '#000000', // 마크다운 텍스트를 검정색으로 설정
//     padding: '20px',
//     borderRadius: '8px'
//   },
// };

export default MainPage;


// import React, { useState } from 'react';
// import MDEditor from '@uiw/react-md-editor';

// const MainPage = () => {
//   const [markdown, setMarkdown] = useState(`# AWS Demo Factory Overview

// ## 서비스 개요
// 이 서비스는 AWS의 다양한 서비스들을 활용한 데모를 쉽게 확인하고 적용할 수 있도록 하는 서비스 입니다. 감사합니다.

// ## 서비스 설명
// - AWS IAM Identity Center를 통해 사용자와 그룹의 액세스 권한을 관리합니다.
// - Amazon Q를 사용하여 다양한 AI 및 머신러닝 모델을 배포하고 관리할 수 있습니다.
// - AWS S3, Lambda, DynamoDB 등 다양한 AWS 서비스를 통합하여 데모 환경을 제공합니다.
// `);

//   return (
//     <div style={{ padding: '20px' }}>
//       <MDEditor
//         value={markdown}
//         onChange={setMarkdown}
//         height={500}
//       />
//       <MDEditor.Markdown source={markdown} style={{ whiteSpace: 'pre-wrap' }} />
//     </div>
//   );
// };

// export default MainPage;



