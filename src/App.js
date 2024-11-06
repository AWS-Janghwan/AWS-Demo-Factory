
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './Sidebar'; // 왼쪽 사이드바 메뉴
import Header from './Header';   // 상단 헤더
import MainPage from './MainPage'; // 메인 페이지
import DemoIntro from './DemoIntro'; // 데모 소개 페이지
import DemoVideo from './DemoVideo'; // 데모 비디오 페이지
import DemoArchitecture from './DemoArchitecture'; // 데모 아키텍처 페이지
import DemoCode from './DemoCode'; // 데모 코드 페이지

// 데모 컨텐츠 데이터 정의
const demoContent = {
  1: {
    intro: '# Demo #1 Intro. \n\n This is Demo1',
    videoUrl: 'https://aws-demo-factory.s3.us-west-2.amazonaws.com/aws-demo.mp4',
    architecture: '# IAM Identity Center Architecture\n![Architecture](https://via.placeholder.com/150)',
    code: '# Code\n```javascript\nconsole.log("Demo 1 Code");\n```'
    
  },
  
  2: {
    intro: '# Demo2',
    videoUrl: 'https://aws-demo-factory.s3.us-west-2.amazonaws.com/aws-demo.mp4',
    architecture: '# IAM Identity Center Architecture\n![Architecture](https://via.placeholder.com/150)',
    code: '# Code\n```javascript\nconsole.log("Demo 2 Code");\n```'
  },

  3: {
    intro: '# Demo3',
    videoUrl: 'https://aws-demo-factory.s3.us-west-2.amazonaws.com/aws-demo.mp4',
    architecture: '# IAM Identity Center Architecture\n![Architecture](https://via.placeholder.com/150)',
    code: '# Code\n```javascript\nconsole.log("Demo 3 Code");\n```'
  },

  // 추가적인 데모 항목을 여기에 정의
};

function App() {
  return (
    <Router>
      <Header /> {/* 상단 헤더 */}
      <div style={{ display: 'flex' }}>
        <Sidebar /> {/* 왼쪽 사이드바 */}
        <div style={{ marginLeft: '250px', padding: '70px 20px', width: '100%' }}>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/demo/:id/intro" element={<DemoIntro content={demoContent} />} />
            <Route path="/demo/:id/video" element={<DemoVideo content={demoContent} />} />
            <Route path="/demo/:id/architecture" element={<DemoArchitecture content={demoContent} />} />
            <Route path="/demo/:id/code" element={<DemoCode content={demoContent} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;