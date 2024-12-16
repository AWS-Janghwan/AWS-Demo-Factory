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
  preload: 'metadata',
  playsInline: true,
  controls: true,
};

const demoContent = {
  1: {
    intro: '# MES Chatbot Demo \n\n This is MES Chatbot Demo',
    videoUrl: '/source/movie/GenAI_MES-Chatbot.mp4',
    architecture: '# MES Chatbot Architecture\n![Architecture](https://via.placeholder.com/150)',
  },
  2: {
    intro: '# AVEVA Historian Demo \n\n This is AVEVA Historian Demo',
    videoUrl: '/source/movie/GenAI_Aveva_PI.mp4',
    architecture: '# AVEVA Historian Architecture\n![Architecture](https://via.placeholder.com/150)',
  }
};

const smartFactoryContent = {
  1: {
    intro: '# Smart Factory Demo \n\n This is Smart Factory Demo',
    videoUrl: '/source/movie/SF_DDI.mp4',
    architecture: '# Smart Factory Architecture\n![Architecture](https://via.placeholder.com/150)',
  },
  2: {
    intro: '# Smart Factory Demo \n\n This is Smart Factory Demo',
    videoUrl: '/source/movie/SF_Smart_Fire_Detection_Reporting.mp4',
    architecture: '# Smart Factory Architecture\n![Architecture](https://via.placeholder.com/150)',
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

  const handleMenuSelect = (menuId) => {
    setActiveMenu(menuId);
    updateSidebarItems(menuId);
  };

  const updateSidebarItems = (menuId) => {
    const sidebarConfig = {
      GenAI: [
        {
          title: 'MES Chatbot',
          subItems: [
            { title: 'Introduction', path: '/demo/1/intro' },
            { title: 'Video', path: '/demo/1/video' },
            { title: 'Architecture', path: '/demo/1/architecture' }
          ]
        },
        {
          title: 'AVEVA Historian',
          subItems: [
            { title: 'Introduction', path: '/demo/2/intro' },
            { title: 'Video', path: '/demo/2/video' },
            { title: 'Architecture', path: '/demo/2/architecture' }
          ]
        }
      ],
      SmartFactory: [
        {
          title: 'DDI EDS Demo',
          subItems: [
            { title: 'Introduction', path: '/SmartFactory/1/intro' },
            { title: 'Video', path: '/SmartFactory/1/video' },
            { title: 'Architecture', path: '/SmartFactory/1/architecture' }
          ]
        },
        {
          title: 'Fire Detection',
          subItems: [
            { title: 'Introduction', path: '/SmartFactory/2/intro' },
            { title: 'Video', path: '/SmartFactory/2/video' },
            { title: 'Architecture', path: '/SmartFactory/2/architecture' }
          ]
        }
      ],
      contact: [
        {
          title: 'Contact Us',
          subItems: [
            { title: 'Email', path: '/contact/email' },
            { title: 'Support', path: '/contact/support' },
            { title: 'FAQ', path: '/contact/faq' }
          ]
        }
      ]
    };

    setSidebarItems(sidebarConfig[menuId] || []);
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
            <Route path="/demo/:id/video" element={<DemoVideo content={demoContent} videoConfig={videoConfig} />} />
            <Route path="/demo/:id/architecture" element={<DemoArchitecture content={demoContent} />} />
            <Route path="/SmartFactory/:id/intro" element={<SmartFactoryIntro content={smartFactoryContent} />} />
            <Route path="/SmartFactory/:id/video" element={<SmartFactoryVideo content={smartFactoryContent} videoConfig={videoConfig} />} />
            <Route path="/SmartFactory/:id/architecture" element={<SmartFactoryArchitecture content={smartFactoryContent} />} />
            <Route path="/contact/*" element={<MainPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
