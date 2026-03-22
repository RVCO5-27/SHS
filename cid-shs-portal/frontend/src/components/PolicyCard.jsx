import React from 'react';

export default function PolicyCard({ policies, onDownload, onView, isAdmin = false }) {
  return (
    <div className="policy-grid">
      {policies.map((policy) => (
        <div key={policy.id} className="content-card policy-card">
          <div className="policy-header">
            <h4 className="policy-title">{policy.title}</h4>
            <span className="badge bg-primary">{policy.sub_category}</span>
          </div>
          <p className="policy-description">{policy.description}</p>
          <div className="policy-meta">
            <span>Ref: {policy.ref_no}</span>
            <span>Date: {new Date(policy.date_issued).toLocaleDateString()}</span>
          </div>
          <div className="policy-actions">
            <button className="btn btn-primary btn-sm me-2" onClick={() => onDownload(policy)}>
              Download PDF
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onView(policy)}>
              Preview
            </button>
            {isAdmin && (
              <button className="btn btn-danger btn-sm ms-2">Delete</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

