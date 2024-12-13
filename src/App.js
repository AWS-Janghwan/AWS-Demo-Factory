import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MainPage from './MainPage';
import DemoIntro from './menu/DemoIntro';
import DemoVideo from './menu/DemoVideo';
import DemoArchitecture from './menu/DemoArchitecture';
// import DemoCode from './menu/DemoCode';

import SmartFactoryIntro from './menu/SmartFactoryIntro';
import SmartFactoryVideo from './menu/SmartFactoryVideo';
import SmartFactoryArchitecture from './menu/SmartFactoryArchitecture';
// import SmartFactoryCode from './SmartFactoryCode';

// 데모 컨텐츠 데이터 정의
const demoContent = {
    1: {
        intro: '# MES Chatbot Demo \n\n This is MES Chatbot Demo',
        videoUrl: '/source/movie/GenAI_MES-Chatbot.mp4',
        architecture: '# MES Chatbot Architecture\n![Architecture](https://via.placeholder.com/150)',
        code: '# Code\n```javascript\nconsole.log("MES Chatbot Demo");\n```'
    },
    2: {
        intro: '# AVEVA Historian Demo \n\n This is AVEVA Historian Demo',
        videoUrl: '/source/movie/GenAI_Aveva_PI.mp4',
        architecture: '# AVEVA Historian Architecture\n![Architecture](https://via.placeholder.com/150)',
        code: '# Code\n```javascript\nconsole.log("AVEVA Historian Demo");\n```'
    }
};

const smartFactoryContent = {
    1: {intro: '# Smart Factory Demo \n\n This is Smart Factory Demo',
    videoUrl: 'https://aws-demo-factory.s3.us-west-2.amazonaws.com/smart-factory-demo.mp4',
    architecture: '# Smart Factory Architecture\n![Architecture](https://via.placeholder.com/150)',
    code: '# Code\n```javascript\nconsole.log("Smart Factory Demo");\n```'
    },
    2: {intro: '# Smart Factory Demo \n\n This is Smart Factory Demo',
        videoUrl: 'https://aws-demo-factory.s3.us-west-2.amazonaws.com/smart-factory-demo.mp4',
        architecture: '# Smart Factory Architecture\n![Architecture](https://via.placeholder.com/150)',
        code: '# Code\n```javascript\nconsole.log("Smart Factory Demo");\n```'
        }
};


function App() {
    const [activeMenu, setActiveMenu] = useState('GenAI'); // 초기값을 GenAI로 설정
    const [sidebarItems, setSidebarItems] = useState([]);

    // 초기 렌더링 시 GenAI 메뉴 아이템 설정
    useEffect(() => {
        updateSidebarItems('GenAI');
    }, []);

    const handleMenuSelect = (menuId) => {
        setActiveMenu(menuId);
        updateSidebarItems(menuId);
    };

    const updateSidebarItems = (menuId) => {
        switch(menuId) {
            case 'GenAI':
                setSidebarItems([
                    {
                        title: 'MES Chatbot',
                        subItems: [
                            { title: 'Introduction', path: '/demo/1/intro' },
                            { title: 'Video', path: '/demo/1/video' },
                            { title: 'Architecture', path: '/demo/1/architecture' },
                            // { title: 'Code', path: '/demo/1/code' }
                        ]
                    },
                    {
                        title: 'AVEVA Historian',
                        subItems: [
                            { title: 'Introduction', path: '/demo/2/intro' },
                            { title: 'Video', path: '/demo/2/video' },
                            { title: 'Architecture', path: '/demo/2/architecture' },
                            // { title: 'Code', path: '/demo/2/code' }
                        ]
                    }
                ]);
                break;
            case 'SmartFactory':
                setSidebarItems([
                    {
                        title: 'DDI EDS Demo',
                        subItems: [
                            { title: 'Introduction', path: '/SmartFactory/1/intro' },
                            { title: 'Video', path: '/SmartFactory/1/video' },
                            { title: 'Architecture', path: '/SmartFactory/1/architecture' },
                            // { title: 'Code', path: '/SmartFactory/code' }
                        ]
                    },
                    {
                        title: 'Fire Detection',
                        subItems: [
                            { title: 'Introduction', path: '/SmartFactory/2/intro' },
                            { title: 'Video', path: '/SmartFactory/2/video' },
                            { title: 'Architecture', path: '/SmartFactory/2/architecture' },
                            // { title: 'Code', path: '/SmartFactory/code' }
                        ]
                    }
                ]);
                break;

            case 'contact':
                setSidebarItems([
                    {
                        title: 'Contact Us',
                        subItems: [
                            { title: 'Email', path: '/contact/email' },
                            { title: 'Support', path: '/contact/support' },
                            { title: 'FAQ', path: '/contact/faq' }
                        ]
                    }
                ]);
                break;
            default:
                setSidebarItems([]);
        }
    };

    return (
        <Router>
            <Header onMenuSelect={handleMenuSelect} activeMenu={activeMenu} />
            <div style={{ display: 'flex' }}>
                <Sidebar items={sidebarItems} activeMenu={activeMenu} />
                <div style={{ marginLeft: '250px', padding: '120px 20px', width: '100%' }}>
                    <Routes>
                        <Route path="/" element={<MainPage />} />
                        <Route path="/demo/:id/intro" element={<DemoIntro content={demoContent} />} />
                        <Route path="/demo/:id/video" element={<DemoVideo content={demoContent} />} />
                        <Route path="/demo/:id/architecture" element={<DemoArchitecture content={demoContent} />} />
                        {/* <Route path="/demo/:id/code" element={<DemoCode content={demoContent} />} />
                        <Route path="/aveva-demo/*" element={<DemoIntro content={demoContent} />} /> */}
                          
                          {/* SmartFactory 라우트 추가 */}
                        <Route path="/SmartFactory/:id/intro" element={<SmartFactoryIntro content={smartFactoryContent} />} />
                        <Route path="/SmartFactory/:id/video" element={<SmartFactoryVideo content={smartFactoryContent} />} />
                        <Route path="/SmartFactory/:id/architecture" element={<SmartFactoryArchitecture content={smartFactoryContent} />} />
                        {/* <Route path="/SmartFactory/code" element={<SmartFactoryCode />} /> */}

                        <Route path="/contact/*" element={<MainPage />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;





// import React from 'react';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import Sidebar from './Sidebar'; // 왼쪽 사이드바 메뉴
// import Header from './Header';   // 상단 헤더
// import MainPage from './MainPage'; // 메인 페이지
// import DemoIntro from './DemoIntro'; // 데모 소개 페이지
// import DemoVideo from './DemoVideo'; // 데모 비디오 페이지
// import DemoArchitecture from './DemoArchitecture'; // 데모 아키텍처 페이지
// import DemoCode from './DemoCode'; // 데모 코드 페이지

// // 데모 컨텐츠 데이터 정의
// const demoContent = {
//   1: {
//     intro: '# Demo #1 Intro. \n\n This is Demo1',
//     videoUrl: 'https://aws-demo-factory.s3.us-west-2.amazonaws.com/aws-demo.mp4',
//     architecture: '# IAM Identity Center Architecture\n![Architecture](https://via.placeholder.com/150)',
//     code: '# Code\n```javascript\nconsole.log("Demo 1 Code");\n```'
    
//   },
  
//   2: {
//     intro: '# Demo2',
//     videoUrl: 'https://aws-demo-factory.s3.us-west-2.amazonaws.com/aws-demo.mp4',
//     architecture: '# IAM Identity Center Architecture\n![Architecture](https://via.placeholder.com/150)',
//     code: '# Code\n```javascript\nconsole.log("Demo 2 Code");\n```'
//   },

//   3: {
//     intro: '# Demo3',
//     videoUrl: 'https://aws-demo-factory.s3.us-west-2.amazonaws.com/aws-demo.mp4',
//     architecture: '# IAM Identity Center Architecture\n![Architecture](https://via.placeholder.com/150)',
//     code: '# Code\n```javascript\nconsole.log("Demo 3 Code");\n```'
//   },

//   // 추가적인 데모 항목을 여기에 정의
// };

// function App() {
//   return (
//     <Router>
//       <Header /> {/* 상단 헤더 */}
//       <div style={{ display: 'flex' }}>
//         <Sidebar /> {/* 왼쪽 사이드바 */}
//         <div style={{ marginLeft: '250px', padding: '120px 20px', width: '100%' }}>
//           <Routes>
//             <Route path="/" element={<MainPage />} />
//             <Route path="/demo/:id/intro" element={<DemoIntro content={demoContent} />} />
//             <Route path="/demo/:id/video" element={<DemoVideo content={demoContent} />} />
//             <Route path="/demo/:id/architecture" element={<DemoArchitecture content={demoContent} />} />
//             <Route path="/demo/:id/code" element={<DemoCode content={demoContent} />} />
//           </Routes>
//         </div>
//       </div>
//     </Router>
//   );
// }

// export default App;