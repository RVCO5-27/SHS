import React, { useState, useEffect } from 'react';
import './dashboard.css';

// Components
import CarouselSlider from '../components/CarouselSlider';

// Services
import { fetchFolders, fetchFilesForFolder, searchDocuments, deleteDocument, getDashboardStats } from '../services/documentService';
import { quickInfo, news, calendarEvents } from '../services/mockData';

// Mock user data
const mockUser = {
  name: 'Admin User',
  email: 'admin@sdocabuyao.edu.ph',
  role: 'Administrator'
};

// Navigation links
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

// Core sections
const coreSections = [
  { key: 'about', title: 'About', desc: 'Overview', icon: '🏛️', color: '#3b4cb8' },
  { key: 'org', title: 'Org Structure', desc: 'Leadership', icon: '🏢', color: '#3b4cb8' },
  { key: 'policy', title: 'Policy', desc: 'Guidelines', icon: '📋', color: '#3b4cb8' },
  { key: 'issuances', title: 'Issuances', desc: 'Orders', icon: '📜', color: '#3b4cb8' },
  { key: 'services', title: 'Services', desc: 'Support', icon: '🛠️', color: '#3b4cb8' },
  { key: 'inventory', title: 'Inventory', desc: 'Assets', icon: '📦', color: '#3b4cb8' },
  { key: 'research', title: 'Research', desc: 'Studies', icon: '🔬', color: '#3b4cb8' }
];

/**
 * Dashboard - Main SHS Portal Dashboard
 * 
 * Layout Structure:
 * - container-fluid (full width)
 * - Flex: sidebar (240px fixed) + main-content (flex-grow:1)
 * - Prevent horizontal overflow (overflow-x: hidden)
 * - Main content padding: 20px desktop, 10-15px tablet/mobile
 */
export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState({
    schoolYear: '',
    gradeLevel: '',
    strand: '',
    documentType: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  
  // Load folders on mount
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const data = await fetchFolders();
        setFolders(data);
        if (data && data.length > 0) {
          setActiveFolder(data[0].id);
        }
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };
    loadFolders();
  }, []);
  
  // Load files when active folder changes
  useEffect(() => {
    if (!activeFolder) return;
    let mounted = true;
    const loadFiles = async () => {
      setLoading(true);
      try {
        const docs = await fetchFilesForFolder(activeFolder);
        if (mounted) setFiles(docs);
      } catch (error) {
        console.error('Error loading files:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadFiles();
    return () => { mounted = false; };
  }, [activeFolder]);
  
  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      setLoading(true);
      try {
        const results = await searchDocuments({ q: query, ...filterValues });
        setFiles(results);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    } else if (activeFolder) {
      setIsSearching(false);
      const docs = await fetchFilesForFolder(activeFolder);
      setFiles(docs);
    }
  };
  
  // Handle filter change
  const handleFilterChange = async (filterType, value) => {
    const newFilters = { ...filterValues, [filterType]: value };
    setFilterValues(newFilters);
    
    setLoading(true);
    try {
      const results = await searchDocuments({ 
        q: searchQuery, 
        ...newFilters 
      });
      setFiles(results);
    } catch (error) {
      console.error('Error filtering:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle delete document
  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await deleteDocument(documentId);
      // Refresh file list
      const docs = await fetchFilesForFolder(activeFolder);
      setFiles(docs);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };
  
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="container-fluid g-0">
      <div className="dashboard-container">
      {/* Sidebar - Fixed 240px width (desktop), collapsible on mobile */}
      <aside className={`sidebar ${sidebarOpen ? 'show' : ''}`}>
        <div className="sidebar-header">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Seal_of_the_Department_of_Education_%28Philippines%29.svg/1200px-Seal_of_the_Department_of_Education_%28Philippines%29.svg.png" 
            alt="DepEd" 
            style={{ maxHeight: '50px' }}
          />
          <h5 className="text-white mb-0 mt-2">SHS Portal</h5>
          <small className="text-white-50">SDO Cabuyao</small>
        </div>
        
        <nav className="sidebar-nav">
          {navLinks.map(link => (
            <a key={link.to} href={link.to} className="nav-item">
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content - flex-grow:1 */}
      <main className="main-content">
        {/* Header */}
        <header className="main-header">
          <div className="header-left">
            <button className="btn-menu d-md-none" onClick={toggleSidebar}>☰</button>
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Seal_of_the_Department_of_Education_%28Philippines%29.svg/1200px-Seal_of_the_Department_of_Education_%28Philippines%29.svg.png" 
              alt="Logo" 
              className="header-logo"
            />
            <div>
              <h1 className="header-title">SHS Portal</h1>
              <small className="text-muted">SDO Cabuyao City</small>
            </div>
          </div>
          
          <div className="header-right">
            <div className="search-box d-none d-md-flex">
              <input type="text" placeholder="Search..." />
              <button>🔍</button>
            </div>
            <button className="btn-icon">🔔</button>
            <div className="user-menu">
              <span className="user-avatar">{mockUser.name.charAt(0)}</span>
              <span className="user-name d-none d-md-inline">{mockUser.name}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="dashboard-body">
          {/* Carousel Slider */}
          <div className="carousel-section mb-4">
            <CarouselSlider />
          </div>

          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div>
              <h2>Welcome to SHS Portal</h2>
              <p className="mb-0">Your central hub for news, documents, and resources</p>
            </div>
            <div className="welcome-meta d-none d-md-block">
              <small className="text-muted">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</small>
              <strong className="d-block" style={{ color: '#3b4cb8' }}>{mockUser.role}</strong>
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="quick-info-grid">
            {quickInfo.slice(0, 4).map(item => (
              <div className="quick-card" key={item.id}>
                <div className="quick-card-icon">{item.icon}</div>
                <div className="quick-card-content">
                  <h6>{item.title}</h6>
                  <p>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Portal Sections */}
          <div className="portal-sections">
            <h5 className="section-title">Portal Sections</h5>
            <div className="sections-grid">
              {coreSections.map(section => (
                <a key={section.key} href={`#${section.key}`} className="section-card">
                  <span className="section-icon">{section.icon}</span>
                  <span className="section-name">{section.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Document Explorer */}
          <div className="explorer-section">
            <h5 className="section-title">📁 Issuances & Documents</h5>
            
            {/* Floating Filter Buttons - Flex container with gap: 12px */}
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >All</button>
              <button 
                className={`filter-btn ${activeFilter === 'pdfs' ? 'active' : ''}`}
                onClick={() => setActiveFilter('pdfs')}
              >PDFs</button>
              <button 
                className={`filter-btn ${activeFilter === 'policies' ? 'active' : ''}`}
                onClick={() => setActiveFilter('policies')}
              >Policies</button>
              <button 
                className={`filter-btn ${activeFilter === 'memos' ? 'active' : ''}`}
                onClick={() => setActiveFilter('memos')}
              >Memos</button>
            </div>

            {/* Explorer Grid: Folder List (250px) + Document List (1fr) */}
            <div className="explorer-grid">
              {/* Folder List */}
              <div className="folder-list">
                <div className="folder-list-header">
                  <span>Folders</span>
                </div>
                <div className="folder-items">
                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      className={`folder-item ${folder.id === activeFolder ? 'active' : ''}`}
                      onClick={() => setActiveFolder(folder.id)}
                    >
                      📂 {folder.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document List */}
              <div className="document-list">
                <div className="document-toolbar">
                  <div className="toolbar-left">
                    <span className="breadcrumb">📂 {folders.find(f => f.id === activeFolder)?.label || 'Select Folder'}</span>
                  </div>
                  <div className="toolbar-center">
                    <div className="search-input-wrapper">
                      <input 
                        type="text" 
                        className="search-input"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                      <span className="search-icon">🔍</span>
                    </div>
                  </div>
                  <div className="toolbar-actions">
                    <button className="btn-icon-sm" title="Refresh" onClick={() => {
                      setSearchQuery('');
                      setIsSearching(false);
                      setActiveFolder(folders[0]?.id);
                    }}>🔄</button>
                  </div>
                </div>
                
                {/* Filter Bar */}
                <div className="filter-bar">
                  <select 
                    className="filter-select"
                    value={filterValues.schoolYear}
                    onChange={(e) => handleFilterChange('schoolYear', e.target.value)}
                  >
                    <option value="">All Years</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                  <select 
                    className="filter-select"
                    value={filterValues.gradeLevel}
                    onChange={(e) => handleFilterChange('gradeLevel', e.target.value)}
                  >
                    <option value="">All Grades</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                  <select 
                    className="filter-select"
                    value={filterValues.strand}
                    onChange={(e) => handleFilterChange('strand', e.target.value)}
                  >
                    <option value="">All Strands</option>
                    <option value="STEM">STEM</option>
                    <option value="ABM">ABM</option>
                    <option value="HUMSS">HUMSS</option>
                    <option value="GAS">GAS</option>
                    <option value="ICT">ICT</option>
                    <option value="Sports">Sports</option>
                  </select>
                  <select 
                    className="filter-select"
                    value={filterValues.documentType}
                    onChange={(e) => handleFilterChange('documentType', e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="memo">Memo</option>
                    <option value="policy">Policy</option>
                    <option value="guide">Guide</option>
                    <option value="report">Report</option>
                  </select>
                </div>
                
                <div className="document-table-wrap">
                  {loading ? (
                    <div className="loading-spinner">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : files.length > 0 ? (
                    <table className="document-table">
                      <thead>
                        <tr>
                          <th>Document Name</th>
                          <th>Size</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map(file => (
                          <tr key={file.id}>
                            <td>
                              <span className="doc-icon">📄</span>
                              <span className="doc-name">{file.name}</span>
                            </td>
                            <td className="doc-size">{file.size}</td>
                            <td>
                              <button 
                                className="btn-action"
                                onClick={() => window.open(`/api/documents/${file.id}/download`, '_blank')}
                              >
                                👁️ View
                              </button>
                              <button 
                                className="btn-action btn-action-primary"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `/api/documents/${file.id}/download`;
                                  link.download = file.name;
                                  link.click();
                                }}
                              >
                                ⬇️
                              </button>
                              <button 
                                className="btn-action btn-action-danger"
                                onClick={() => handleDelete(file.id)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-files">No files found</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Dashboard: News & Calendar - Grid 2fr:1fr */}
          <div className="bottom-dashboard">
            <div className="news-section">
              <div className="news-header">
                <h5>📰 Latest News</h5>
              </div>
              <div className="news-feed">
                {news.slice(0, 5).map(n => (
                  <div key={n.id} className="news-item">
                    <div className="news-badge">{n.category}</div>
                    <div className="news-content">
                      <h6>{n.title}</h6>
                      <small className="text-muted">📅 {n.date}</small>
                    </div>
                    <button className="btn-read">Read</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="calendar-section">
              <div className="calendar-header">
                <h5>📅 Calendar</h5>
              </div>
              <CalendarWidget events={calendarEvents} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="main-footer">
          <small>© 2026 SDO Cabuyao City. All rights reserved.</small>
          <small>Version 1.0.0</small>
        </footer>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}
    </div>
    </div>
  );
}

// Calendar Widget - Compact month grid, today highlight
function CalendarWidget({ events }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  
  const eventsMap = new Map(events.map(e => [e.date, e.title]));
  
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = now.getDate();
  
  return (
    <div className="calendar-widget">
      <h6 className="calendar-month">{now.toLocaleString('default', { month: 'long' })} {year}</h6>
      <table>
        <thead>
          <tr>
            {weekDays.map(day => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(cells.length / 7) }).map((_, r) => (
            <tr key={r}>
              {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
                const dateStr = d ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
                const hasEvent = dateStr && eventsMap.has(dateStr);
                const isToday = d === today;
                
                return (
                  <td 
                    key={i} 
                    className={`${hasEvent ? 'has-event' : ''} ${isToday ? 'today' : ''}`}
                  >
                    {d}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
