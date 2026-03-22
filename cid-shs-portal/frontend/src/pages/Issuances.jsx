import React, { useEffect, useMemo, useState } from 'react';
import '../pages/main-content.css';
import IssuanceHeader from '../components/IssuanceHeader';
import IssuanceFilters from '../components/IssuanceFilters';
import IssuanceTabs from '../components/IssuanceTabs';
import DocumentTable from '../components/DocumentTable';
import PolicyCard from '../components/PolicyCard';

const MOCK_ISSUANCES = [
  {
    id: 1,
    title: 'Implementation of Senior High School School-Based Feeding Program for SY 2026-2027',
    ref_no: 'DM-2026-015',
    category: 'memorandum',
    sub_category: 'Division Memorandum',
    description: 'Guidelines on the implementation of the SHS School-Based Feeding Program',
    file_url: '/files/dm-2026-015.pdf',
    year: 2026,
    date_issued: '2026-01-15',
  },

  {
    id: 2,
    title: 'Enrollment Guidelines for Senior High School SY 2026-2027',
    ref_no: 'DM-2026-012',
    category: 'memorandum',
    sub_category: 'Division Memorandum',
    description: 'Policies and procedures for SHS enrollment',
    file_url: '/files/dm-2026-012.pdf',
    year: 2026,
    date_issued: '2026-01-10',
  },
  {
    id: 3,
    title: 'DepEd Order No. 12, s. 2026: K to 12 Curriculum',
    ref_no: 'DO-2026-012',
    category: 'policy',
    sub_category: 'DepEd Order',
    description: 'Policy guidelines on the implementation of the K to 12 Basic Education Program',
    file_url: '/files/do-2026-012.pdf',
    year: 2026,
    date_issued: '2026-02-01',
  },
  {
    id: 4,
    title: 'Regional Memorandum No. 2026-034: Training Schedule',
    ref_no: 'RM-2026-034',
    category: 'memorandum',
    sub_category: 'Regional Memorandum',
    description: 'Training schedule for SHS teachers and administrators',
    file_url: '/files/rm-2026-034.pdf',
    year: 2026,
    date_issued: '2026-02-15',
  },
  {
    id: 5,
    title: 'DepEd Order No. 08, s. 2025: Assessment Policy',
    ref_no: 'DO-2025-008',
    category: 'policy',
    sub_category: 'DepEd Order',
    description: 'Revised assessment and grading policy for K to 12',
    file_url: '/files/do-2025-008.pdf',
    year: 2025,
    date_issued: '2025-03-20',
  },
  {
    id: 6,
    title: 'Advisory on NAT Administration for SHS',
    ref_no: 'ADV-2026-005',
    category: 'advisory',
    sub_category: 'Advisory',
    description: 'Advisory on the administration of National Achievement Test',
    file_url: '/files/adv-2026-005.pdf',
    year: 2026,
    date_issued: '2026-03-01',
  },
];

const AVAILABLE_YEARS = [2026, 2025, 2024];

const tabDescriptions = {
  memoranda: 'Division and regional memoranda supporting implementation, coordination, and school operations.',
  policies: 'Official policy issuances and regulatory guidance relevant to SHS delivery and administration.',
};

export function IssuancesPage() {
  const [activeTab, setActiveTab] = useState('memoranda');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      setDocuments(MOCK_ISSUANCES);
      setLoading(false);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (activeTab === 'memoranda') {
      filtered = filtered.filter((doc) => doc.category === 'memorandum');
    } else if (activeTab === 'policies') {
      filtered = filtered.filter((doc) => doc.category === 'policy');
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter((doc) => doc.year === Number.parseInt(selectedYear, 10));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.ref_no.toLowerCase().includes(query) ||
          (doc.description && doc.description.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }, [documents, activeTab, selectedCategory, selectedYear, searchQuery]);

  const issuanceSummary = useMemo(() => {
    const memorandumCount = documents.filter((doc) => doc.category === 'memorandum').length;
    const policyCount = documents.filter((doc) => doc.category === 'policy').length;

    return [
      { label: 'Visible results', value: filteredDocuments.length },
      { label: 'Memoranda', value: memorandumCount },
      { label: 'Policies', value: policyCount },
    ];
  }, [documents, filteredDocuments]);

  const handleDownload = (doc) => {
    alert(`Downloading: ${doc.title}`);
  };

  const handleView = (doc) => {
    alert(`Viewing: ${doc.title}`);
  };

  const isAdmin = () => localStorage.getItem('userType') === 'admin';

  return (
    <div className="issuances-page">
      <section className="issuances-hero card">
        <div className="issuances-hero__content">
          <div>
            <p className="issuances-hero__eyebrow">Official repository</p>
            <IssuanceHeader title="Issuances" />
          </div>
          <p className="issuances-hero__copy">
            Explore formal SHS memoranda, policy issuances, and implementation references through a structured discovery interface designed for schools and stakeholders.
          </p>
        </div>

        <div className="issuances-summary-grid">
          {issuanceSummary.map((item) => (
            <article key={item.label} className="issuances-summary-card">
              <span className="issuances-summary-card__label">{item.label}</span>
              <strong className="issuances-summary-card__value">{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <IssuanceFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        availableYears={AVAILABLE_YEARS}
      />

      <section className="issuances-content card">
        <div className="issuances-content__header">
          <div>
            <p className="issuances-content__eyebrow">Content view</p>
            <h2 className="issuances-content__title">Browse documents by resource type</h2>
          </div>
          <p className="issuances-content__copy">{tabDescriptions[activeTab]}</p>
        </div>

        <div className="mb-4">
          <IssuanceTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="issuances-results-shell">
          {loading ? (
            <div className="issuances-loading-state">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="issuances-results-meta">
                <span className="issuances-results-meta__count">{filteredDocuments.length} result(s) found</span>
                <span className="issuances-results-meta__hint">Use the filters above to refine the resource list.</span>
              </div>

              {activeTab === 'memoranda' && (
                <DocumentTable documents={filteredDocuments} onDownload={handleDownload} isAdmin={isAdmin()} />
              )}

              {activeTab === 'policies' && (
                <PolicyCard
                  policies={filteredDocuments}
                  onDownload={handleDownload}
                  onView={handleView}
                  isAdmin={isAdmin()}
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default IssuancesPage;

