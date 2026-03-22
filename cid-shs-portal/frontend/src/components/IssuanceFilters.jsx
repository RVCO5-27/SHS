import React from 'react';

export default function IssuanceFilters({ 
  searchQuery, 
  onSearchChange, 
  selectedCategory, 
  onCategoryChange, 
  selectedYear, 
  onYearChange, 
  availableYears 
}) {
  return (
    <section className="issuance-filters-panel content-card">
      <div className="issuance-filters-panel__intro">
        <div>
          <p className="section-eyebrow">Refine results</p>
          <h3 className="section-title">Filter issuances by type and year</h3>
        </div>
        <p className="section-copy">
          Use filters to narrow down memoranda, policies, advisories, and other official documents.
        </p>
      </div>

      <div className="issuance-filters-panel__grid">
        <div className="issuance-filters-field issuance-filters-field--search">
          <label className="issuance-filters-field__label">Search documents</label>
          <div className="issuance-search-control">
            <span className="issuance-search-control__icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              className="issuance-search-control__input"
              placeholder="Search by title, reference, or description..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="issuance-search-control__clear"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="issuance-filters-field">
          <label className="issuance-filters-field__label">Category</label>
          <select
            className="form-select issuance-filters-field__select"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="memorandum">Memorandum</option>
            <option value="policy">Policy</option>
            <option value="advisory">Advisory</option>
          </select>
        </div>

        <div className="issuance-filters-field">
          <label className="issuance-filters-field__label">School Year</label>
          <select
            className="form-select issuance-filters-field__select"
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
          >
            <option value="all">All Years</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="issuance-filters-field">
          <label className="issuance-filters-field__label">Document Type</label>
          <select className="form-select issuance-filters-field__select">
            <option>All Types</option>
            <option>Division Memorandum</option>
            <option>DepEd Order</option>
            <option>Regional Memorandum</option>
          </select>
        </div>
      </div>

      <div className="issuance-filters-panel__note">
        <span className="issuance-filters-panel__note-label">Tip</span>
        <p>Filters apply instantly. Use search for specific keywords in titles or descriptions.</p>
      </div>
    </section>
  );
}

