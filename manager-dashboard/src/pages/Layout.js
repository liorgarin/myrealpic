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

  return (
    <div style={{ display: 'flex' }}>
      <div style={{
        width: '200px',
        background: '#eee',
        padding: '20px',
        height: '100vh',
        boxSizing: 'border-box'
      }}>
        <h3>Manager Menu</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: 10 }}><Link to="/">Dashboard</Link></li>
          <li style={{ marginBottom: 10 }}><Link to="/settings">Settings</Link></li>
          {isMasterManager && (
            <li style={{ marginBottom: 10 }}><Link to="/coupons">Coupons</Link></li>
          )}
          <li style={{ marginBottom: 10 }}><button onClick={handleLogout}>Logout</button></li>
        </ul>
      </div>
      <div style={{ flex: 1, padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}