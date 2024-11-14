import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ items }) => {
    const [openItem, setOpenItem] = useState(null); // 단일 메뉴만 열리도록 수정
    const location = useLocation();

    const toggleItem = (index) => {
        setOpenItem(openItem === index ? null : index);
    };

    // 현재 활성화된 경로 확인
    const isActiveSubItem = (path) => {
        return location.pathname === path;
    };

    return (
        <div style={sidebarStyle}>
            <ul style={menuListStyle}>
                {items.map((item, index) => (
                    <li key={index} style={menuItemStyle}>
                        <div 
                            onClick={() => toggleItem(index)}
                            style={{
                                ...menuTitleStyle,
                                backgroundColor: openItem === index ? '#4f52ba' : '#232f3e',
                                fontWeight: openItem === index ? 'bold' : 'normal',
                            }}
                        >
                            {item.title}
                        </div>
                        {item.subItems && (
                            <ul style={{
                                ...subMenuListStyle,
                                display: openItem === index ? 'block' : 'none'
                            }}>
                                {item.subItems.map((subItem, subIndex) => (
                                    <li key={subIndex}>
                                        <Link 
                                            to={subItem.path}
                                            style={{
                                                ...subMenuItemStyle,
                                                backgroundColor: isActiveSubItem(subItem.path) ? '#4f52ba' : 'transparent',
                                                fontWeight: isActiveSubItem(subItem.path) ? 'bold' : 'normal',
                                            }}
                                        >
                                            {subItem.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const sidebarStyle = {
    width: '220px',
    backgroundColor: '#232f3e',
    position: 'fixed',
    height: '100%',
    color: '#fff',
    paddingTop: '125px',
};

const menuListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
};

const menuItemStyle = {
    marginBottom: '2px',
};

const menuTitleStyle = {
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    ':hover': {
        backgroundColor: '#4f52ba',
    },
};

const subMenuListStyle = {
    listStyle: 'none',
    padding: '0',
    backgroundColor: '#1b2735',
    transition: 'all 0.3s ease',
};

const subMenuItemStyle = {
    color: '#ffffff',
    textDecoration: 'none',
    padding: '10px 32px',
    display: 'block',
    fontSize: '14px',
    transition: 'background-color 0.3s ease',
    ':hover': {
        backgroundColor: '#4f52ba',
    },
};

export default Sidebar;