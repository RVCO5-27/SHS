import { Link } from 'react-router-dom';
import './HomeIssuancesTeaser.css';

const QUICK_LINKS = [
  { label: 'Memoranda', to: '/issuances?type=memoranda', icon: '📜' },
  { label: 'Policies', to: '/issuances?type=policies', icon: '📋' },
  { label: 'Advisories', to: '/issuances?type=advisories', icon: '⚠️' },
];

/**
 * Home-only teaser — full explorer lives at /issuances (no duplicated carousel or dashboard).
 */
export default function HomeIssuancesTeaser({ uploadFiles = [] }) {
  return (
    <div className="home-issuances-teaser">
      <p className="home-issuances-teaser__lead">
        Browse official division memoranda, policies, and advisories. Use filters and folders on the
        dedicated Issuances page.
      </p>

      <div className="home-issuances-teaser__row">
        <div className="home-issuances-teaser__quick">
          <h3 className="home-issuances-teaser__subhead">Jump to</h3>
          <ul className="home-issuances-teaser__pills" role="list">
            {QUICK_LINKS.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="home-issuances-teaser__pill">
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="home-issuances-teaser__cta">
          <Link to="/issuances" className="home-issuances-teaser__btn-primary">
            Open Issuances &amp; Documents
          </Link>
          <p className="home-issuances-teaser__hint">
            Search, filter by year, and manage files in the full workspace.
          </p>
        </div>
      </div>

      {uploadFiles.length > 0 && (
        <div className="home-issuances-teaser__uploads">
          <h3 className="home-issuances-teaser__subhead">Files in uploads folder</h3>
          <ul className="home-issuances-teaser__file-list" role="list">
            {uploadFiles.slice(0, 5).map((name) => (
              <li key={name}>
                <a
                  href={`/uploads/${encodeURIComponent(name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="home-issuances-teaser__file-link"
                >
                  <span aria-hidden="true">📄</span>
                  {name}
                </a>
              </li>
            ))}
          </ul>
          {uploadFiles.length > 5 && (
            <p className="home-issuances-teaser__more">+{uploadFiles.length - 5} more on disk</p>
          )}
        </div>
      )}
    </div>
  );
}
