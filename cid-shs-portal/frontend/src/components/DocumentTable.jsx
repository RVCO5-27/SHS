import React from 'react';

export default function DocumentTable({ documents, onDownload, isAdmin = false }) {
  return (
    <div className="document-table-wrap content-card">
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Reference</th>
            <th>Date</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>
                <strong>{doc.title}</strong>
                <div className="text-secondary small">{doc.description}</div>
              </td>
              <td>{doc.ref_no}</td>
              <td>{new Date(doc.date_issued).toLocaleDateString()}</td>
              <td>
                <span className="badge bg-primary">{doc.sub_category}</span>
              </td>
              <td>
                <button className="btn btn-sm btn-primary me-2" onClick={() => onDownload(doc)}>
                  Download
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => window.open(doc.file_url)}>
                  View
                </button>
                {isAdmin && (
                  <button className="btn btn-sm btn-danger ms-2">Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

