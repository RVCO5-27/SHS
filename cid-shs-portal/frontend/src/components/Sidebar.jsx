import React from 'react';
import { NavLink } from 'react-router-dom';

// Navigation links with icons
const navLinks = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/about', label: 'About', icon: '🏛️' },
  { to: '/org', label: 'Organizational Structure', icon: '🏢' },
  { to: '/policy', label: 'Policy', icon: '📋' },
  { to: '/issuances', label: 'Issuances', icon: '📜' },
  { to: '/services', label: 'Services', icon: '🛠️' },
  { to: '/inventory', label: 'Inventory', icon: '📦' },
  { to: '/research', label: 'Research & Innovation', icon: '🔬' }
];

/**
 * Sidebar - Fixed navigation sidebar with SDO Cabuyao branding
 * @param {boolean} isOpen - Whether sidebar is open (mobile)
 * @param {function} onClose - Callback to close sidebar
 */
export function Sidebar({ isOpen = true, onClose }) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay d-lg-none" 
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1040
          }}
        />
      )}
      
      <nav 
        className={`sidebar d-flex flex-column vh-100 p-3 ${isOpen ? 'd-block' : 'd-none'} d-lg-flex`} 
        style={{ 
          width: '260px', 
          position: 'fixed', 
          left: 0, 
          top: 0, 
          zIndex: 1050
        }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-4 pt-2">
          <div className="mb-2">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Seal_of_the_Department_of_Education_%28Philippines%29.svg/1200px-Seal_of_the_Department_of_Education_%28Philippines%29.svg.png" 
              alt="DepEd Seal" 
              style={{ width: '64px', height: '64px', objectFit: 'contain' }}
            />
          </div>
          <h5 className="sidebar-title mb-1">SHS Portal</h5>
          <small className="text-white-50">SDO Cabuyao City</small>
        </div>
        
        <hr className="border-light" />
        
        {/* Navigation Links */}
        <ul className="nav nav-pills flex-column">
          {navLinks.map(link => (
            <li className="nav-item" key={link.to}>
              <NavLink 
                end 
                to={link.to} 
                className={({isActive}) => 
                  `nav-link d-flex align-items-center ${isActive ? 'active' : ''}`
                }
                onClick={onClose}
              >
                <span className="me-2">{link.icon}</span>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        
        {/* Footer */}
        <div className="mt-auto pt-3">
          <small className="text-white-50 d-block text-center">
            © 2026 SDO Cabuyao
          </small>
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
