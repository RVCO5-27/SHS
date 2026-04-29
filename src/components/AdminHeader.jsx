import React from 'react';
import './AdminHeader.css';

const AdminHeader = ({ user, notificationCount = 0, onNotificationClick }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <h1 className="dashboard-title">Dashboard</h1>
      </div>
      
      <div className="header-right">
        <button className="notification-btn" onClick={onNotificationClick}>
          <svg 
            className="bell-icon" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {notificationCount > 0 && (
            <span className="notification-badge">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        <div className="user-info">
          <div className="user-details">
            <span className="username">{user?.name || 'Admin User'}</span>
            <span className="user-role">{user?.role || 'Administrator'}</span>
          </div>
        </div>

        <div className="avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="avatar-img" />
          ) : (
            <span className="avatar-initials">
              {getInitials(user?.name)}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;