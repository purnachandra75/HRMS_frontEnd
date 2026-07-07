import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

export default function AdminHeader({ userName, onLogout, title }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (typeof onLogout === 'function') onLogout();
    navigate('/login');
  };

  return (
    <header className="dashboard-header employee-fixed-header">
      <div>
        <h1>{'Admin Dashboard'}</h1>
      </div>
      <div className="header-info">
        <span>Welcome, {userName}!</span>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </header>
  );
}
