import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MainPage from './MainPage';
import DemoIntro from './menu/DemoIntro';
import DemoVideo from './menu/DemoVideo';
import DemoArchitecture from './menu/DemoArchitecture';
import SmartFactoryIntro from './menu/SmartFactoryIntro';
import SmartFactoryVideo from './menu/SmartFactoryVideo';
import SmartFactoryArchitecture from './menu/SmartFactoryArchitecture';

const videoConfig = {
  chunkSize: 1024 * 1024, // 1MB chunks
  preloadTime: 20, // 20 seconds preload
};

const demoContent = {
  1: {
    intro: '# MES Chatbot Demo \n\n This is MES Chatbot Demo',
    videoUrl: '/source/movie/GenAI_MES-Chatbot.mp4',
    videoConfig,
    architecture: '# MES Chatbot Architecture\n![Architecture](https://via.placeholder.com/150)'
  },
  2: {
    intro: '# AVEVA Historian Demo \n\n This is AVEVA Historian Demo',
    videoUrl: '/source/movie/GenAI_Aveva_PI.mp4',
    videoConfig,
    architecture: '# AVEVA Historian Architecture\n![Architecture](https://via.placeholder.com/150)'
  }
};

const smartFactoryContent = {
  1: {
    intro: '# Smart Factory Demo \n\n This is Smart Factory Demo',
    videoUrl: '/source/movie/SF_DDI.mp4',
    videoConfig,
    architecture: '# Smart Factory Architecture\n![Architecture](https://via.placeholder.com/150)'
  },
  2: {
    intro: '# Smart Factory Demo \n\n This is Smart Factory Demo',
    videoUrl: '/source/movie/SF_Smart_Fire_Detection_Reporting.mp4',
    videoConfig,
    architecture: '# Smart Factory Architecture\n![Architecture](https://via.placeholder.com/150)'
  }
};

function App() {
  const [activeMenu, setActiveMenu] = useState('GenAI');
  const [sidebarItems, setSidebarItems] = useState([]);

  useEffect(() => {
    updateSidebarItems('GenAI');
    preloadVideos();
  }, []);

  const preloadVideos = () => {
    const videos = [
      '/source/movie/GenAI_MES-Chatbot.mp4',
      '/source/movie/GenAI_Aveva_PI.mp4',
      '/source/movie/SF_DDI.mp4',
      '/source/movie/SF_Smart_Fire_Detection_Reporting.mp4'
    ];

    videos.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = url;
      document.head.appendChild(link);
    });
  };

  // handleMenuSelect 및 updateSidebarItems 함수는 그대로 유지

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
            <Route path="/SmartFactory/:id/intro" element={<SmartFactoryIntro content={smartFactoryContent} />} />
            <Route path="/SmartFactory/:id/video" element={<SmartFactoryVideo content={smartFactoryContent} />} />
            <Route path="/SmartFactory/:id/architecture" element={<SmartFactoryArchitecture content={smartFactoryContent} />} />
            <Route path="/contact/*" element={<MainPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
