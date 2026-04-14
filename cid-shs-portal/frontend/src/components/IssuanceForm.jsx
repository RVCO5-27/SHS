import React, { useState, useEffect, useRef } from 'react';
import { fetchCategories, fetchAdminFolders } from '../services/issuancesDocumentService';
import './../pages/admin-console.css';

export default function IssuanceForm({ initial = {}, onCancel, onSave }) {
  const [formData, setFormData] = useState({
    doc_number: initial.doc_number || '',
    title: initial.title || '',
    category_id: initial.category_id || '',
    folder_id: initial.folder_id || '',
    date_issued: initial.date_issued ? new Date(initial.date_issued).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    signatory: initial.signatory || '',
    series_year: initial.series_year || new Date().getFullYear(),
    tags: initial.tags || '',
    description: initial.description || '',
    ...initial
  });
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const loadCategoriesAndFolders = async () => {
      setLoadingCategories(true);
      try {
        const [catData, folderData] = await Promise.all([
          fetchCategories(),
          fetchAdminFolders()
        ]);
        setCategories(catData);
        setFolders(folderData);
      } catch (err) {
        console.error('Failed to load categories/folders:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategoriesAndFolders();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    });
    
    if (file) {
      data.append('files', file);
    }
    
    onSave(data);
  };

  const getFlatFolders = (tree, level = 0) => {
    let flat = [];
    tree.forEach(f => {
      flat.push({ id: f.id, name: `${'—'.repeat(level)} ${f.name}` });
      if (f.children) {
        flat = [...flat, ...getFlatFolders(f.children, level + 1)];
      }
    });
    return flat;
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
          <div className="modal-header border-0 pb-0 pe-4 pt-4">
            <h4 className="modal-title fw-bold text-dark" style={{ fontSize: '1.5rem' }}>
              {formData.id ? 'Edit Document Entry' : 'New Document Entry'}
            </h4>
            <button type="button" className="btn-close" onClick={onCancel} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="row g-4">
                <div className="col-12">
                  <label className="form-label fw-medium mb-1" style={{ color: '#4a5568' }}>Name or Title</label>
                  <input
                    type="text"
                    className="form-control"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter document title..."
                    style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', padding: '0.75rem' }}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium mb-1" style={{ color: '#4a5568' }}>Document Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="doc_number"
                    value={formData.doc_number}
                    onChange={handleChange}
                    placeholder="Enter document number (e.g., DM 001)"
                    style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', padding: '0.75rem' }}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium mb-1" style={{ color: '#4a5568' }}>Files (Max 50MB each)</label>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-light border"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                    >
                      Choose Files
                    </button>
                    <span className="text-muted small text-truncate">
                      {file ? file.name : 'No file chosen'}
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="d-none"
                      accept=".pdf"
                      onChange={handleFileChange}
                      required={!formData.id}
                    />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label fw-medium mb-1" style={{ color: '#4a5568' }}>Folder selection (e.g., 2026, Memoranda)</label>
                  <select
                    className="form-select"
                    name="folder_id"
                    value={formData.folder_id}
                    onChange={handleChange}
                    style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', padding: '0.75rem' }}
                  >
                    <option value="">Select Folder</option>
                    {getFlatFolders(folders).map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium mb-1" style={{ color: '#4a5568' }}>Document Type</label>
                  <select
                    className="form-select"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', padding: '0.75rem' }}
                    required
                  >
                    <option value="">Select Type</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium mb-1" style={{ color: '#4a5568' }}>Date Issued</label>
                  <input
                    type="date"
                    className="form-control"
                    name="date_issued"
                    value={formData.date_issued}
                    onChange={handleChange}
                    style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', padding: '0.75rem' }}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium mb-1" style={{ color: '#4a5568' }}>Signatory</label>
                  <input
                    type="text"
                    className="form-control"
                    name="signatory"
                    value={formData.signatory}
                    onChange={handleChange}
                    placeholder="Name of signatory"
                    style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', padding: '0.75rem' }}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium mb-1" style={{ color: '#4a5568' }}>Tags (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g., memo, implementation, 2026"
                    style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', padding: '0.75rem' }}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium mb-1" style={{ color: '#4a5568' }}>Description (Optional)</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Brief summary..."
                    style={{ backgroundColor: '#f7fafc', border: '1px solid #e2e8f0', padding: '0.75rem' }}
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 p-4 pt-0 justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-light border px-4"
                onClick={onCancel}
                style={{ fontWeight: '500' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4"
                style={{ backgroundColor: '#2563eb', border: 'none', fontWeight: '500' }}
              >
                Begin Upload
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
