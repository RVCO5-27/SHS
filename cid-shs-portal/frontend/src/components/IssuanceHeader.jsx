import React from 'react';

export default function IssuanceHeader({ title, subtitle = 'Official SHS Implementation References' }) {
  return (
    <div className="issuance-header">
      <h1 className="hero-title">{title}</h1>
      {subtitle && <p className="hero-copy">{subtitle}</p>}
    </div>
  );
}

