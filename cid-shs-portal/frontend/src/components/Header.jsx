import React, { useState } from 'react';

/**
 * Header - Top navigation bar with SDO Cabuyao branding
 * @param {object} user - User object for display
 * @param {function} onMenuToggle - Callback to toggle sidebar on mobile
 */
export function Header({ user, onMenuToggle }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  return (
    <header 
      className="header d-flex align-items-center justify-content-between px-4 py-3" 
      style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1030 
      }}
    >
      <div className="d-flex align-items-center">
        {/* Mobile menu toggle */}
        <button 
          className="btn btn-outline-primary d-lg-none me-3" 
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          style={{ borderRadius: '8px' }}
        >
          ☰
        </button>
        
        {/* Logo */}
        <div className="d-flex align-items-center">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Seal_of_the_Department_of_Education_%28Philippines%29.svg/1200px-Seal_of_the_Department_of_Education_%28Philippines%29.svg.png" 
            alt="DepEd Logo" 
            className="header-logo me-3"
          />
          <div>
            <div className="header-brand h5 mb-0">SHS Portal</div>
            <div className="header-subtitle">SDO Cabuyao City</div>
          </div>
        </div>
      </div>
      
      {/* Right side - Search & User */}
      <div className="d-flex align-items-center gap-3">
        {/* Search (placeholder) */}
        <div className="d-none d-md-block">
          <div className="input-group" style={{ width: '250px' }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search..." 
              style={{ borderRadius: '8px 0 0 8px' }}
            />
            <button 
              className="btn btn-outline-primary" 
              type="button"
              style={{ borderRadius: '0 8px 8px 0' }}
            >
              🔍
            </button>
          </div>
        </div>
        
        {/* Notifications */}
        <button 
          className="btn btn-light position-relative"
          aria-label="Notifications"
          style={{ borderRadius: '8px' }}
        >
          🔔
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem' }}
          >
            3
          </span>
        </button>
        
        {/* User Menu */}
        {user ? (
          <div className="dropdown">
            <button 
              className="btn btn-outline-primary dropdown-toggle d-flex align-items-center" 
              type="button" 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              style={{ borderRadius: '8px' }}
            >
              <div 
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="d-none d-md-inline">{user.name}</span>
            </button>
            
            {dropdownOpen && (
              <div className="dropdown-menu dropdown-menu-end show shadow-lg" style={{ borderRadius: '12px', padding: '0.5rem', minWidth: '200px' }}>
                <div className="px-3 py-2 border-bottom">
                  <strong>{user.name}</strong>
                  <br />
                  <small className="text-muted">{user.email}</small>
                </div>
                <a className="dropdown-item py-2 rounded" href="#profile">👤 Profile</a>
                <a className="dropdown-item py-2 rounded" href="#settings">⚙️ Settings</a>
                <hr className="dropdown-divider" />
                <a className="dropdown-item py-2 rounded text-danger" href="#logout">🚪 Logout</a>
              </div>
            )}
          </div>
        ) : (
          <button 
            className="btn btn-primary"
            style={{ borderRadius: '8px' }}
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
