import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (error) {
      alert(error.message);
    }
  };

  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
    fontFamily: 'Arial, sans-serif'
  };

  const cardStyle = {
    background: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    padding: '30px 40px',
    maxWidth: '300px',
    width: '100%',
    textAlign: 'center'
  };

  const titleStyle = {
    marginBottom: '20px',
    fontSize: '24px',
    fontWeight: '600',
    color: '#333'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    marginBottom: '16px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.3s'
  };

  const inputFocusStyle = {
    borderColor: '#007BFF'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    backgroundColor: '#007BFF',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.3s'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={titleStyle}>Manager Login</h2>
        <input
          style={inputStyle}
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onFocus={e => (e.target.style.borderColor = '#007BFF')}
          onBlur={e => (e.target.style.borderColor = '#ccc')}
        />
        <input
          style={inputStyle}
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onFocus={e => (e.target.style.borderColor = '#007BFF')}
          onBlur={e => (e.target.style.borderColor = '#ccc')}
        />
        <button style={buttonStyle} onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
}