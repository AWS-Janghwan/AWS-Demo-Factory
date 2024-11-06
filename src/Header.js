

import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header style={headerStyle}>
      {/* 로고 추가 */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" 
          alt="AWS Logo" 
          style={logoStyle} 
        />
        {/* 웹사이트 제목 수정 */}
        <h1 style={titleStyle}>AWS Demo Factory</h1>
      </Link>
    </header>
  );
};

// 스타일 정의
const headerStyle = {
  backgroundColor: '#232f3e',
  padding: '20px 20px',
  display: 'flex',
  alignItems: 'center',
  position: 'fixed', // 헤더를 고정
  top: 0, // 페이지 상단에 고정
  left: 0,
  width: '100%',
  zIndex: 1000, // 다른 요소 위에 표시되도록 설정  
  };

const logoStyle = {
  width: '50px', // 로고 크기 조정
  marginRight: '10px', // 로고와 텍스트 사이 간격
};

const titleStyle = {
  color: '#ffffff', // 흰색 텍스트
  fontSize: '40px',
  margin: 0,
};

export default Header;


// ####################

// import React from 'react';
// import { Link } from 'react-router-dom';
// import logo from './logo2.png';

// const Header = () => {
//   return (
//     <div style={{ backgroundColor: '#232f3e', color: 'white', padding: '10px 20px', display: 'flex', alignItems: 'center' }}>
//       <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
//         <img 
//           src="logo2.png" 
//           alt="AWS Logo" 
//           style={{ height: '50px', marginRight: '10px' }} 
//         />
//       </Link>
    
//         <h1 style={{ margin: 0 }}>AWS Demo Factory</h1>

//     </div>
//   );
// };

// export default Header;