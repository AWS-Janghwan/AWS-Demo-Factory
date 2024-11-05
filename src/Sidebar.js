import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const [openDemo, setOpenDemo] = useState(null);

  // 데모 목록 정의
  const demos = [
    { id: 1, name: 'MES Chatbot' },
    { id: 2, name: 'AVEVA Demo' },
    // { id: 3, name: 'Test' },
  ];

  // 서브메뉴 토글 함수
  const toggleSubmenu = (id) => {
    setOpenDemo(openDemo === id ? null : id);
  };

  return (
    <div style={{ width: '250px', backgroundColor: '#232f3e', position: 'fixed', height: '100%', color: '#fff' }}>
      {/* 상단에 "Home" 텍스트 추가 */}
      {/* <Link to="/" className="home-link" style={{ display: 'block', padding: '20px', textAlign: 'left', color: '#fff', fontSize: '18px', fontWeight: 'bold', textDecoration: 'none' }}>
        Home
      </Link> */}

      {/* 메뉴 리스트 */}
      <ul style={{ listStyleType: 'none', paddingLeft: '0', marginTop: '20px' }}>
        {demos.map(demo => (
          <li key={demo.id} style={{ marginBottom: '10px' }}>
            {/* 상위 메뉴 */}
            <div 
              onClick={() => toggleSubmenu(demo.id)} 
              style={{
                cursor: 'pointer',
                padding: '10px 20px',
                backgroundColor: openDemo === demo.id ? '#4f52ba' : '#232f3e',
                color: '#fff',
                fontWeight: openDemo === demo.id ? 'bold' : 'normal',
                transition: 'background-color 0.3s ease'
              }}
            >
              {demo.name}
            </div>

            {/* 서브메뉴 */}
            {openDemo === demo.id && (
              <ul style={{ listStyleType: 'none', paddingLeft: '20px', backgroundColor: '#1b2735' }}>
                <li style={{ paddingTop: '5px', paddingBottom: '5px' }}>
                  <Link to={`/demo/${demo.id}/intro`} style={submenuLinkStyle}>Introduction</Link>
                </li>
                <li style={{ paddingTop: '5px', paddingBottom: '5px' }}>
                  <Link to={`/demo/${demo.id}/video`} style={submenuLinkStyle}>Video</Link>
                </li>
                <li style={{ paddingTop: '5px', paddingBottom: '5px' }}>
                  <Link to={`/demo/${demo.id}/architecture`} style={submenuLinkStyle}>Architecture</Link>
                </li>
                <li style={{ paddingTop: '5px', paddingBottom: '5px' }}>
                  <Link to={`/demo/${demo.id}/code`} style={submenuLinkStyle}>Code</Link>
                </li>
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

// 서브메뉴 링크 스타일
const submenuLinkStyle = {
  color: '#ffffff',
  textDecoration: 'none',
  display: 'block',
  paddingLeft: '10px',
  transition: 'color 0.3s ease'
};

export default Sidebar;