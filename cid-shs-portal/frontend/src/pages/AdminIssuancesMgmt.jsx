import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getFolderTree, createFolder, updateFolder, deleteFolder, bulkMoveFolders,
  listIssuances, createIssuance, deleteIssuance, bulkUpdateIssuances 
} from '../services/adminIssuancesMgmt';
import CreateFolderForm from '../components/admin/CreateFolderForm';
import './admin-issuances-premium.css';

const AdminIssuancesMgmt = () => {
  const [folders, setFolders] = useState([]);
  const [issuances, setIssuances] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('issuance');
  const [formData, setFormData] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [bulkSelection, setBulkSelection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]); // For Undo/Redo
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };
  
  // URL and Storage based navigation state
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || localStorage.getItem('admin_issuance_tab') || 'all';
  });

  const [filterPreset, setFilterPreset] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('status') || 'all';
  });

  // Sync URL and LocalStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    params.set('status', filterPreset);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    localStorage.setItem('admin_issuance_tab', activeTab);
  }, [activeTab, filterPreset]);

  const filteredIssuances = useMemo(() => {
    let base = [...issuances];
    if (activeTab === 'starred') {
      // Mock starred logic - in real world this would be a server-side filter
      base = base.filter(i => i.is_starred); 
    }
    if (filterPreset === 'published') return base.filter(i => i.status === 'published');
    if (filterPreset === 'draft') return base.filter(i => i.status === 'draft');
    if (filterPreset === 'archived') return base.filter(i => i.status === 'archived');
    return base;
  }, [issuances, filterPreset, activeTab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const folderParams = { parent_id: selectedFolder ? selectedFolder.id : 'null' };
      const folderList = await getFolderTree(folderParams);
      setFolders(folderList);

      const issuanceParams = { 
        folder_id: selectedFolder ? selectedFolder.id : 'null',
        status: filterPreset !== 'all' ? filterPreset : undefined,
        tab: activeTab
      };
      const issuanceList = await listIssuances(issuanceParams);
      setIssuances(issuanceList.data);
    } catch (err) {
      setError('Encountered an issue loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, filterPreset, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time search with debounce (mocked with simple effect for now)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) performSearch();
      else if (searchQuery === '') loadData();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, loadData]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const [fList, iList] = await Promise.all([
        getFolderTree({ q: searchQuery, parent_id: selectedFolder?.id }),
        listIssuances({ q: searchQuery, folder_id: selectedFolder?.id })
      ]);
      setFolders(fList);
      setIssuances(iList.data);
    } catch (err) {
      setError('Search failed to execute.');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderDoubleClick = (folder) => {
    setSelectedFolder(folder);
    setCurrentPath([...currentPath, folder]);
  };

  const navigateToBreadcrumb = (index) => {
    if (index === -1) {
      setSelectedFolder(null);
      setCurrentPath([]);
    } else {
      const folder = currentPath[index];
      setSelectedFolder(folder);
      setCurrentPath(currentPath.slice(0, index + 1));
    }
  };

  const onDragStart = (e, id, type) => {
    e.dataTransfer.setData('id', id);
    e.dataTransfer.setData('type', type);
    e.currentTarget.classList.add('dragging');
  };

  const onDrop = async (e, targetFolderId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('id');
    const type = e.dataTransfer.getData('type');
    
    if (id === targetFolderId.toString() && type === 'folder') return;

    try {
      if (type === 'folder') {
        await updateFolder(id, { parent_id: targetFolderId });
      } else {
        // Implementation for moving issuance
      }
      loadData();
    } catch (err) {
      setError('Move operation failed.');
    }
  };

  const handleBulkAction = async (action, value) => {
    if (bulkSelection.length === 0) return;
    const previousIssuances = [...issuances];
    const previousSelection = [...bulkSelection];
    
    setLoading(true);
    try {
      await bulkUpdateIssuances({ ids: bulkSelection, action, value });
      setBulkSelection([]);
      await loadData();
      
      // Store action in history for Undo
      setHistory(prev => [{
        type: 'bulk',
        action,
        ids: previousSelection,
        originalData: previousIssuances
      }, ...prev].slice(0, 10));
      
    } catch (err) {
      setError('Bulk operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (history.length === 0) return;
    const lastAction = history[0];
    setLoading(true);
    try {
      // Revert logic based on action type
      if (lastAction.type === 'bulk') {
        // This would require a specific revert endpoint or logic
        // For now we just refresh and notify
        await loadData();
      }
      setHistory(prev => prev.slice(1));
    } catch (err) {
      setError('Undo failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createFolder({ 
        name: formData.name, 
        description: formData.description,
        parent_id: selectedFolder?.id 
      });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssuance = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (selectedFolder) data.append('folder_id', selectedFolder.id);
    selectedFiles.forEach(file => data.append('files', file));

    try {
      await createIssuance(data);
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create issuance');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolderSuccess = async (folderData) => {
    try {
      const result = await createFolder(folderData);
      setIsModalOpen(false);
      showToast(`Folder '${folderData.name}' created`);
      
      // Auto-redirect to newly created folder
      handleFolderDoubleClick({ id: result.id, name: folderData.name });
    } catch (err) {
      throw err; // Handled by component
    }
  };

  return (
    <div className="admin-issuances-mgmt animate-fade-in">
      {toast && (
        <div className="premium-toast animate-fade-in">
          <span className="toast-icon">✅</span>
          <span className="toast-message">{toast}</span>
        </div>
      )}
      <div className="admin-issuances-mgmt__container">
        {/* Modern Sidebar */}
        <aside className="admin-issuances-mgmt__sidebar">
          <div className="sidebar-section">
            <h5 className="sidebar-section-title">Navigation</h5>
            <nav className="sidebar-nav">
              <button 
                className={`nav-item ${activeTab === 'all' ? 'active' : ''}`} 
                onClick={() => setActiveTab('all')}
              >
                <span className="nav-icon">🏠</span> All Issuances
              </button>
              <button 
                className={`nav-item ${activeTab === 'starred' ? 'active' : ''}`} 
                onClick={() => setActiveTab('starred')}
              >
                <span className="nav-icon">⭐</span> Starred
              </button>
              <button 
                className={`nav-item ${activeTab === 'recent' ? 'active' : ''}`} 
                onClick={() => setActiveTab('recent')}
              >
                <span className="nav-icon">🕒</span> Recent
              </button>
            </nav>
          </div>
          
          <div className="sidebar-section">
            <h5 className="sidebar-section-title">Quick Filters</h5>
            <div className="preset-filters">
              <button 
                className={`filter-pill ${filterPreset === 'all' ? 'active' : ''}`}
                onClick={() => setFilterPreset('all')}
              >
                All
              </button>
              <button 
                className={`filter-pill ${filterPreset === 'published' ? 'active' : ''}`}
                onClick={() => setFilterPreset('published')}
              >
                Published
              </button>
              <button 
                className={`filter-pill ${filterPreset === 'draft' ? 'active' : ''}`}
                onClick={() => setFilterPreset('draft')}
              >
                Drafts
              </button>
              <button 
                className={`filter-pill ${filterPreset === 'archived' ? 'active' : ''}`}
                onClick={() => setFilterPreset('archived')}
              >
                Archived
              </button>
            </div>
          </div>
        </aside>

        {/* Main Interface */}
        <main className="admin-issuances-mgmt__main">
          <header className="admin-header-row">
            <div className="admin-nav-breadcrumb">
              <span className="admin-nav-breadcrumb__item" onClick={() => navigateToBreadcrumb(-1)}>Root</span>
              {currentPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <span className="breadcrumb-sep">/</span>
                  <span className={`admin-nav-breadcrumb__item ${index === currentPath.length - 1 ? 'active' : ''}`} 
                        onClick={() => navigateToBreadcrumb(index)}>
                    {folder.name}
                  </span>
                </React.Fragment>
              ))}
            </div>

              <div className="admin-header-actions">
                <div className="admin-search-wrapper">
                  <span className="search-icon-abs">🔍</span>
                  <input 
                    type="text" 
                    className="admin-search-input" 
                    placeholder="Search issuances, folders, or tags..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search"
                  />
                </div>
                <button className="admin-btn-secondary" onClick={() => { setModalType('folder'); setFormData({}); setIsModalOpen(true); }}>
                  + New Folder
                </button>
                <label className="admin-btn-primary" style={{ cursor: 'pointer' }}>
                  <span>Upload Document</span>
                  <input 
                    type="file" 
                    multiple 
                    style={{ display: 'none' }} 
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0) {
                        setSelectedFiles(files);
                        setModalType('issuance');
                        setFormData({
                          title: files[0].name.split('.')[0],
                          series_year: new Date().getFullYear(),
                          status: 'draft',
                          date_issued: new Date().toISOString().split('T')[0]
                        });
                        setIsModalOpen(true);
                      }
                    }}
                  />
                </label>
              </div>
          </header>

          {/* Bulk Action Toolbar - High-end Contextual Bar */}
          {bulkSelection.length > 0 && (
            <div className="admin-context-bar animate-fade-in">
              <span className="selection-count">{bulkSelection.length} items selected</span>
              <div className="context-actions">
                <button onClick={() => handleBulkAction('status', 'published')}>Publish</button>
                <button onClick={() => handleBulkAction('status', 'archived')}>Archive</button>
                <button className="danger" onClick={() => handleBulkAction('delete')}>Delete</button>
              </div>
              <button className="close-context" onClick={() => setBulkSelection([])}>✕</button>
            </div>
          )}

          {history.length > 0 && !bulkSelection.length && (
            <div className="admin-undo-bar animate-fade-in">
              <span>Action completed.</span>
              <button className="undo-btn" onClick={handleUndo}>Undo</button>
            </div>
          )}

          {error && <div className="admin-error-toast">{error}</div>}

          {/* Explorer Sections */}
          <section className="admin-explorer-section">
            <h3 className="admin-section-label">Folders</h3>
            <div className="admin-folder-grid">
              {folders.map(folder => (
                <div 
                  key={folder.id} 
                  className="admin-folder-card"
                  onDoubleClick={() => handleFolderDoubleClick(folder)}
                  draggable
                  onDragStart={(e) => onDragStart(e, folder.id, 'folder')}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, folder.id)}
                  tabIndex="0"
                  aria-label={`Folder ${folder.name}`}
                >
                  <div className="admin-folder-card__icon">📁</div>
                  <div className="admin-folder-card__info">
                    <span className="admin-folder-card__name">{folder.name}</span>
                    <span className="admin-folder-card__meta">{new Date(folder.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="admin-folder-card__actions">
                    <button className="icon-btn" title="Options">•••</button>
                  </div>
                </div>
              ))}
              {folders.length === 0 && !loading && <div className="admin-empty-state">No folders found in this directory.</div>}
            </div>
          </section>

          <section className="admin-explorer-section">
            <h3 className="admin-section-label">Documents</h3>
            <div className="admin-table-container">
              <table className="admin-data-table" aria-label="Issuances documents">
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input type="checkbox" onChange={(e) => setBulkSelection(e.target.checked ? filteredIssuances.map(i => i.id) : [])} />
                    </th>
                    <th>Document Name</th>
                    <th>Ref ID</th>
                    <th>Submitted By</th>
                    <th>Status</th>
                    <th>File Info</th>
                    <th>Modified</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssuances.map(issuance => (
                    <tr key={issuance.id} draggable onDragStart={(e) => onDragStart(e, issuance.id, 'issuance')}>
                      <td>
                        <input type="checkbox" checked={bulkSelection.includes(issuance.id)} onChange={() => {
                          setBulkSelection(prev => prev.includes(issuance.id) ? prev.filter(i => i !== issuance.id) : [...prev, issuance.id]);
                        }} />
                      </td>
                      <td className="doc-name-cell">
                        <span className="doc-icon">📄</span>
                        <div className="doc-info-stack">
                          <span className="doc-title">{issuance.title}</span>
                          <span className="doc-category">{issuance.category_name}</span>
                        </div>
                      </td>
                      <td>{issuance.doc_number}</td>
                      <td>{issuance.owner_name || 'System'}</td>
                      <td>
                        <span className={`admin-badge status-${issuance.status}`}>{issuance.status}</span>
                      </td>
                      <td>
                        <div className="file-meta-stack">
                          <span className="file-type">{issuance.file_type || 'PDF'}</span>
                          <span className="file-size">{(issuance.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </td>
                      <td>{new Date(issuance.date_issued).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        <div className="action-button-group">
                          <button className="icon-btn-row" title="Preview" onClick={() => window.open(issuance.file_path, '_blank')}>👁️</button>
                          <button className="icon-btn-row" title="Edit" onClick={() => { setModalType('issuance'); setFormData(issuance); setIsModalOpen(true); }}>✏️</button>
                          <a href={issuance.file_path} download className="icon-btn-row" title="Download">⬇️</a>
                          <button className="icon-btn-row danger" title="Delete" onClick={() => { if(confirm('Are you sure you want to archive this issuance?')) deleteIssuance(issuance.id, 'Admin delete').then(loadData); }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredIssuances.length === 0 && !loading && (
                    <tr><td colSpan="8" className="admin-empty-table">No documents available here.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {loading && (
            <div className="admin-loading-overlay">
              <div className="premium-spinner"></div>
              <span>Updating interface...</span>
            </div>
          )}
        </main>
      </div>

      {/* Premium Modal Implementation */}
      {isModalOpen && (
        <div className="admin-modal-overlay animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <header className="admin-modal-header">
              <h3>{modalType === 'folder' ? 'Create Premium Folder' : 'New Document Entry'}</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </header>
            
            {modalType === 'folder' ? (
              <CreateFolderForm 
                initialParentId={selectedFolder?.id}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={handleCreateFolderSuccess}
              />
            ) : (
              <form className="admin-form" onSubmit={handleCreateIssuance}>
                <div className="admin-form-group">
                  <label>Name or Title</label>
                  <input 
                    type="text" 
                    className="admin-form-input"
                    required 
                    placeholder="Enter document title..."
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                  />
                </div>
                
                <div className="admin-form-group">
                  <label>Document Number</label>
                  <input 
                    type="text" 
                    className="admin-form-input"
                    required 
                    onChange={e => setFormData({...formData, doc_number: e.target.value})} 
                  />
                </div>
                <div className="admin-form-group">
                  <label>Files (Max 50MB each)</label>
                  <input type="file" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files))} />
                </div>

                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="admin-btn-primary" disabled={loading}>
                    {loading ? 'Uploading...' : 'Begin Upload'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIssuancesMgmt;
