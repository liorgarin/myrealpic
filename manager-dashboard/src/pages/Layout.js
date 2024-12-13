import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const isMasterManager = currentUser && currentUser.email === 'reals.pics@gmail.com';

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const containerStyle = {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
    color: '#333'
  };

  const sidebarStyle = {
    width: '220px',
    background: '#1E2A38',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 0'
  };

  const titleStyle = {
    margin: '0 20px 20px 20px',
    fontSize: '20px',
    fontWeight: '600',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    paddingBottom: '10px'
  };

  const navListStyle = {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    flex: 1
  };

  const navItemStyle = {
    marginBottom: '10px',
    padding: '10px 20px'
  };

  const linkStyle = {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '15px',
    fontWeight: '500',
    display: 'block'
  };

  const linkHoverStyle = {
    backgroundColor: 'rgba(255,255,255,0.1)'
  };

  const logoutButtonStyle = {
    background: '#D9534F',
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    width: '100%',
    textAlign: 'left',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '4px',
    marginTop: '20px'
  };

  const contentStyle = {
    flex: 1,
    background: '#F7F8FA',
    padding: '20px',
    boxSizing: 'border-box',
    overflowY: 'auto'
  };

  return (
    <div style={containerStyle}>
      <div style={sidebarStyle}>
        <h3 style={titleStyle}>Manager Menu</h3>
        <ul style={navListStyle}>
          <li style={navItemStyle}>
            <Link
              to="/"
              style={linkStyle}
              onMouseOver={e => e.currentTarget.style.backgroundColor = linkHoverStyle.backgroundColor}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Orders
            </Link>
          </li>
          <li style={navItemStyle}>
            <Link
              to="/settings"
              style={linkStyle}
              onMouseOver={e => e.currentTarget.style.backgroundColor = linkHoverStyle.backgroundColor}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Workers
            </Link>
          </li>
          {isMasterManager && (
            <li style={navItemStyle}>
              <Link
                to="/coupons"
                style={linkStyle}
                onMouseOver={e => e.currentTarget.style.backgroundColor = linkHoverStyle.backgroundColor}
                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Coupons
              </Link>
            </li>
          )}
        </ul>
        <button style={logoutButtonStyle} onClick={handleLogout}>Logout</button>
      </div>
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}