import React from 'react';

export default function IssuanceTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'memoranda', label: 'Memoranda', count: 4 },
    { id: 'policies', label: 'Policies', count: 2 },
  ];

  return (
    <div className="issuance-tabs">
      <nav className="tab-nav" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={0}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

