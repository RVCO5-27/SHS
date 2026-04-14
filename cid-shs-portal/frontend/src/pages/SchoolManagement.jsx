import React, { useState, useEffect } from 'react';
import { getAllSchools, createSchool, updateSchool, deleteSchool } from '../services/schools';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilePdf, FaFileExcel, FaFileCsv, FaTimes, FaSchool, FaUserTie, FaCalendarAlt, FaChevronRight } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './SchoolManagement.css';

export default function SchoolManagement() {
  const { user } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({
    school_id: '',
    school_name: '',
    principal_name: '',
    designation: '',
    year_started: new Date().getFullYear().toString(),
    school_type: 'Public'
  });

  const isSuperAdmin = user?.role === 'SuperAdmin';

  const loadSchools = async () => {
    setLoading(true);
    try {
      const data = await getAllSchools({ search: searchTerm });
      setSchools(data);
    } catch (err) {
      console.error('Failed to load schools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadSchools();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleOpenModal = (school = null) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        school_id: school.school_id,
        school_name: school.school_name,
        principal_name: school.principal_name,
        designation: school.designation,
        year_started: school.year_started.toString(),
        school_type: school.school_type || 'Public'
      });
    } else {
      setEditingSchool(null);
      setFormData({
        school_id: '',
        school_name: '',
        principal_name: '',
        designation: '',
        year_started: new Date().getFullYear().toString(),
        school_type: 'Public'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchool(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchool) {
        await updateSchool(editingSchool.id, formData);
      } else {
        await createSchool(formData);
      }
      handleCloseModal();
      loadSchools();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save school record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this school record?')) return;
    try {
      await deleteSchool(id);
      loadSchools();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete school record');
    }
  };

  const exportData = (format) => {
    if (schools.length === 0) return alert('No data to export');

    const dataToExport = schools.map(s => ({
      'School ID': s.school_id,
      'School Name': s.school_name,
      'Principal Name': s.principal_name,
      'Designation': s.designation,
      'Year Started': s.year_started
    }));

    const fileName = `SHS_Schools_${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Schools');
      
      if (format === 'excel') {
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
      } else {
        XLSX.writeFile(workbook, `${fileName}.csv`, { bookType: 'csv' });
      }
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('SHS School Records', 14, 15);
      
      const tableColumn = ['School ID', 'School Name', 'Principal Name', 'Designation', 'Year Started'];
      const tableRows = schools.map(s => [
        s.school_id,
        s.school_name,
        s.principal_name,
        s.designation,
        s.year_started
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      
      doc.save(`${fileName}.pdf`);
    }
  };

  return (
    <div className="admin-console school-mgmt-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">School Management</h2>
          <p className="text-muted small mb-0">Manage and monitor SHS school records and administrators.</p>
        </div>
        <button className="btn btn-primary btn-lg shadow-sm d-flex align-items-center gap-2 px-4" onClick={() => handleOpenModal()}>
          <FaPlus /> <span>Add School</span>
        </button>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by School ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 d-flex justify-content-md-end gap-2">
              <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" onClick={() => exportData('pdf')}>
                <FaFilePdf /> PDF
              </button>
              <button className="btn btn-outline-success btn-sm d-flex align-items-center gap-1" onClick={() => exportData('excel')}>
                <FaFileExcel /> Excel
              </button>
              <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={() => exportData('csv')}>
                <FaFileCsv /> CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="school-mgmt-table-card">
        <div className="table-responsive">
          <table className="table align-middle mb-0 school-table">
            <thead>
              <tr>
                <th className="ps-4">School ID</th>
                <th>School Name</th>
                <th>Type</th>
                <th>Principal Name</th>
                <th>Designation</th>
                <th>Year Started</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : schools.length > 0 ? (
                schools.map((school) => (
                  <tr key={school.id}>
                    <td className="ps-4 school-id-badge">{school.school_id}</td>
                    <td className="fw-semibold">{school.school_name}</td>
                    <td>
                      <span className={`school-type-badge ${school.school_type.toLowerCase()}`}>
                        {school.school_type}
                      </span>
                    </td>
                    <td>{school.principal_name}</td>
                    <td><span className="designation-pill">{school.designation}</span></td>
                    <td>{school.year_started}</td>
                    <td className="pe-4">
                      <div className="action-btns">
                        <button 
                          className="btn-action-custom edit" 
                          title="Edit School"
                          onClick={() => handleOpenModal(school)}
                          disabled={!isSuperAdmin && school.created_by !== user?.id}
                        >
                          <FaEdit />
                        </button>
                        {isSuperAdmin && (
                          <button 
                            className="btn-action-custom delete" 
                            title="Delete School"
                            onClick={() => handleDelete(school.id)}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <div className="opacity-25 mb-2"><FaSchool size={48} /></div>
                    No school records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Sheet Modal */}
      <div className={`side-sheet-container ${showModal ? 'open' : ''}`}>
        <div className="side-sheet-overlay" onClick={handleCloseModal}></div>
        <div className="side-sheet-content">
          <div className="side-sheet-header">
            <h3>{editingSchool ? 'Edit School Record' : 'Add New School'}</h3>
            <button className="side-sheet-close" onClick={handleCloseModal}>
              <FaTimes />
            </button>
          </div>
          
          <div className="side-sheet-body">
            <form id="schoolForm" onSubmit={handleSubmit} className="school-form-grid">
              <div className="form-group-custom">
                <label>School Name</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaSchool className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Official school name..."
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group-custom">
                  <label>School ID</label>
                  <input
                    type="text"
                    className="form-control-custom"
                    placeholder="e.g. 301234"
                    value={formData.school_id}
                    onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-custom">
                  <label>School Type</label>
                  <select
                    className="form-control-custom"
                    value={formData.school_type}
                    onChange={(e) => setFormData({ ...formData, school_type: e.target.value })}
                    required
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>

              <div className="form-group-custom">
                <label>Principal / School Head</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaUserTie className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Full name of principal..."
                    value={formData.principal_name}
                    onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group-custom">
                  <label>Designation</label>
                  <input
                    type="text"
                    className="form-control-custom"
                    placeholder="e.g. Principal II"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group-custom">
                  <label>Year Started</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                      <FaCalendarAlt className="text-muted" />
                    </span>
                    <input
                      type="number"
                      className="form-control border-start-0 ps-0"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.year_started}
                      onChange={(e) => setFormData({ ...formData, year_started: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="side-sheet-footer">
            <button type="button" className="btn-cancel-full" onClick={handleCloseModal}>
              Cancel
            </button>
            <button type="submit" form="schoolForm" className="btn-save-full">
              {editingSchool ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
