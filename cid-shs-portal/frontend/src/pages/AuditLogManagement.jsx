import React, { useState, useEffect } from 'react';
import { getAllAuditLogs } from '../services/auditLogs';
import { FaHistory, FaSearch, FaFilter, FaEye } from 'react-icons/fa';

export default function AuditLogManagement() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAllAuditLogs({ search: searchTerm, actionType: filterType });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadLogs();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterType]);

  const getActionBadge = (type) => {
    switch (type) {
      case 'CREATE': return 'bg-success';
      case 'UPDATE': return 'bg-primary';
      case 'DELETE': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const renderValue = (val) => {
    if (!val || val === 'null') return 'None';
    try {
      const parsed = JSON.parse(val);
      return <pre className="small mb-0 p-2 bg-light rounded">{JSON.stringify(parsed, null, 2)}</pre>;
    } catch {
      return val;
    }
  };

  return (
    <div className="admin-console">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="d-flex align-items-center gap-2">
          <FaHistory className="text-muted" /> Audit Log Management
        </h2>
        <button className="btn btn-outline-primary btn-sm" onClick={loadLogs}>Refresh Logs</button>
      </div>

      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaSearch className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Search by user, action, or record data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FaFilter className="text-muted" />
                </span>
                <select 
                  className="form-select border-start-0 ps-0"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Action Types</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4">Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Record ID</th>
                <th>IP Address</th>
                <th className="text-end pe-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="ps-4 small">{new Date(log.timestamp).toLocaleString()}</td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="fw-bold">{log.full_name || log.username}</span>
                        <span className="text-muted small">@{log.username}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadge(log.action_type)}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className="fw-mono small">#{log.record_id}</td>
                    <td className="text-muted small">{log.ip_address}</td>
                    <td className="text-end pe-4">
                      <button 
                        className="btn btn-sm btn-light border"
                        onClick={() => setSelectedLog(log)}
                        title="View Full Changes"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">Action Details #{selectedLog.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedLog(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row mb-4">
                  <div className="col-md-6">
                    <p className="text-muted small mb-1">USER</p>
                    <p className="fw-bold mb-0">{selectedLog.full_name} (@{selectedLog.username})</p>
                  </div>
                  <div className="col-md-6 text-md-end">
                    <p className="text-muted small mb-1">TIMESTAMP</p>
                    <p className="fw-bold mb-0">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border h-100">
                      <h6 className="fw-bold text-danger mb-3 border-bottom pb-2">Old Values</h6>
                      {renderValue(selectedLog.old_value)}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded border h-100">
                      <h6 className="fw-bold text-success mb-3 border-bottom pb-2">New Values</h6>
                      {renderValue(selectedLog.new_value)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedLog(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
