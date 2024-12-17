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
  crossOrigin: 'anonymous'
};

const demoContent = {
  // ... (기존 코드 유지)
};

const smartFactoryContent = {
  // ... (기존 코드 유지)
};

function App() {
  const [activeMenu, setActiveMenu] = useState('GenAI');
  const [sidebarItems, setSidebarItems] = useState([]);

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
        ]);
        break;
      case 'SmartFactory':
        setSidebarItems([
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
