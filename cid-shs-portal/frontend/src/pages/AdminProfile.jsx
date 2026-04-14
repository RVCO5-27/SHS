import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AdminProfile.css';

const AdminProfile = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    email: '',
    role: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        full_name: user.full_name || '',
        email: user.email || '',
        role: user.role || 'Admin',
      });
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await api.put('/auth/profile', {
        full_name: profile.full_name,
        email: profile.email,
      });
      
      if (response.data && response.data.user) {
        setUser(response.data.user);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (error) {
      console.error('Profile Update Error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update profile. Please try again.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="profile-loading">
      <div className="loading-spinner-large"></div>
      <p>Loading your profile...</p>
    </div>
  );

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-card">
        <header className="profile-header">
          <div className="header-content">
            <h2>Admin Profile Settings</h2>
            <p>Manage your account information and preferences.</p>
          </div>
        </header>

        {message && (
          <div className={`profile-message-container ${message.type}`}>
            <div className="message-icon">
              {message.type === 'success' ? '✅' : '❌'}
            </div>
            <div className="message-text">{message.text}</div>
            <button className="message-close" onClick={() => setMessage(null)}>✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">

          <div className="section-divider">
            <span>Account Information</span>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Username</label>
              <div className="input-wrapper disabled">
                <span className="input-icon">👤</span>
                <input type="text" value={profile.username} disabled className="disabled-input" />
              </div>
              <p className="field-hint">Username cannot be changed.</p>
            </div>

            <div className="form-group">
              <label>Role</label>
              <div className="input-wrapper disabled">
                <span className="input-icon">🛡️</span>
                <input type="text" value={profile.role} disabled className="disabled-input" />
              </div>
              <p className="field-hint">Your administrative role level.</p>
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">📝</span>
                <input 
                  type="text" 
                  id="full_name" 
                  name="full_name" 
                  value={profile.full_name || ''} 
                  onChange={handleChange} 
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={profile.email || ''} 
                  onChange={handleChange} 
                  placeholder="your.email@deped.gov.ph"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save-modern" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-small"></span>
                  Saving Changes...
                </>
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfile;
