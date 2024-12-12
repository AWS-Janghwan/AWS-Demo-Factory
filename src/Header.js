import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Header = ({ onMenuSelect }) => {
    const [activeDropdown, setActiveDropdown] = useState(null);

    const handleMouseEnter = (menuId) => {
        setActiveDropdown(menuId);
    };

    const handleMouseLeave = () => {
        setActiveDropdown(null);
    };

    const handleClick = (menuId) => {
        onMenuSelect(menuId);
    };



    
    return (
        <header style={headerStyle}>
            <table>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" 
                    alt="AWS Logo" 
                    style={logoStyle} 
                />
                <h1 style={titleStyle}>AWS Demo Factory</h1>
            </Link>

            
            <nav style={navStyle}>
                <ul style={menuListStyle}>
                    <li 
                        onMouseEnter={() => handleMouseEnter('GenAI')}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleClick('GenAI')}
                        style={menuItemContainerStyle}
                    >
                        <span style={menuItemStyle}>Generative AI</span>
                        {activeDropdown === 'GenAI' && (
                            <ul style={dropdownStyle}>
                                <li><Link to="/demo/1/intro" style={dropdownItemStyle}>MES Chatbot</Link></li>
                                <li><Link to="/demo/2/intro" style={dropdownItemStyle}>AVEVA Historian</Link></li>
                            </ul>
                        )}
                    </li>
                    <li 
                        onMouseEnter={() => handleMouseEnter('SmartFactory')}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleClick('SmartFactory')}
                        style={menuItemContainerStyle}
                    >
                        <span style={menuItemStyle}>Smart Factory</span>
                        {activeDropdown === 'SmartFactory' && (
                            <ul style={dropdownStyle}>
                                <li><Link to="/SmartFactory-demo/1/intro" style={dropdownItemStyle}>DDI Demo</Link></li>
                                <li><Link to="/SmartFactory-demo/2/intro" style={dropdownItemStyle}>Fire Detection</Link></li>
                                
                            </ul>
                        )}
                    </li>
                    <li 
                        onClick={() => handleClick('contact')}
                        style={menuItemContainerStyle}
                    >
                        <span style={menuItemStyle}>Contact Us</span>
                    </li>
                </ul>
            </nav>
            </table>
        </header>
    );
};

// 스타일 정의는 기존과 동일하게 유지

const headerStyle = {
  backgroundColor: '#232f3e',
  padding: '20px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  zIndex: 1000,
};

const logoStyle = {
  width: '50px',
  marginRight: '10px',
};

const titleStyle = {
  color: '#ffffff',
  fontSize: '40px',
  margin: 0,
};

// Updated and new styles for dropdown menu
const navStyle = {
  marginLeft: '500px',
  backgroundColor:  '#1c2735',
  borderRadius: '4px',
  padding: '0.5rem 1rem',
  ':hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    
  },

};

const menuListStyle = {
  display: 'flex',
  listStyle: 'none',
  margin: 0,
  padding: 0,
  gap: '2rem',
};

const menuItemContainerStyle = {
  position: 'relative',
  cursor: 'pointer',
};

const menuItemStyle = {
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: '1.1rem',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  transition: 'background-color 0.3s ease',
};

const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: '0',
  backgroundColor: '#1c2735',
  borderRadius: '4px',
  padding: '0.5rem 0',
  minWidth: '150px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
  listStyle: 'none',
};

const dropdownItemStyle = {
  color: '#ffffff',
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  display: 'block',
  fontSize: '1rem',
  transition: 'background-color 0.3s ease',
  ':hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
};

export default Header;





// import React from 'react';
// import { Link } from 'react-router-dom';

// const Header = () => {
//   return (
//     <header style={headerStyle}>
//       {/* 로고 추가 */}
//       <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
//         <img 
//           src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" 
//           alt="AWS Logo" 
//           style={logoStyle} 
//         />
//         {/* 웹사이트 제목 수정 */}
//         <h1 style={titleStyle}>AWS Demo Factory</h1>
//       </Link>
//     </header>
//   );
// };

// // 스타일 정의
// const headerStyle = {
//   backgroundColor: '#232f3e',
//   padding: '20px 20px',
//   display: 'flex',
//   alignItems: 'center',
//   position: 'fixed', // 헤더를 고정
//   top: 0, // 페이지 상단에 고정
//   left: 0,
//   width: '100%',
//   zIndex: 1000, // 다른 요소 위에 표시되도록 설정  
//   };

// const logoStyle = {
//   width: '50px', // 로고 크기 조정
//   marginRight: '10px', // 로고와 텍스트 사이 간격
// };

// const titleStyle = {
//   color: '#ffffff', // 흰색 텍스트
//   fontSize: '40px',
//   margin: 0,
// };

// export default Header;


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