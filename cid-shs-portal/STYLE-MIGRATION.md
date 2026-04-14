# Style Migration Mapping

## Overview
This document tracks all CSS migrations and UI/UX improvements made to the CID-SHS Portal frontend.

---

## Migrated Files

### Page CSS Files (Created)
- `pages/Home.css` - Home page styles (replaced `styles/Home.module.css`)
- `pages/About.css` - About page styles
- `pages/OrganizationalChart.css` - Org chart page styles
- `pages/main-content.css` - Shared styles for Issuances, OrgChart, and IssuanceFilters

### Component CSS Files (Created/Updated)
- `components/IssuanceFilters/IssuanceFilters.css` - Updated with proper styles
- `components/IssuanceTabs/IssuanceTabs.css` - Created for tab component
- `components/IssuanceHeader/IssuanceHeader.css` - Created for header component
- `components/PolicyCard/PolicyCard.css` - Updated with full styles + button styles
- `components/DocumentTable/DocumentTable.css` - Updated with full styles + button styles

### Global CSS
- `styles/globals.css` - Updated with comprehensive CSS custom properties (design tokens)
- `index.css` - Updated to import globals.css

---

## CSS Migration Summary

### From App.css → Component CSS
- App.css contained demo/Vite template styles that were not used
- All relevant styles have been migrated to per-component CSS files

### From index.css → globals.css + Component CSS
- Old index.css styles moved to `styles/globals.css` as CSS custom properties
- Component-specific styles now in respective component CSS files

---

## ARIA Roles Added

### Home Page
- `role="main"` - Main content landmark
- `aria-label="Home"` - Page label
- `role="list"` / `role="listitem"` - File list
- `aria-label` - Links for screen readers

### Issuances Page
- `role="main"` - Main content landmark
- `aria-labelledby` - Connect headings to landmarks
- `role="region"` with `aria-label` - Search results region
- `role="status"` with `aria-live="polite"` - Loading states

### Organizational Chart
- `role="main"` - Main content landmark
- `role="img"` with `aria-label` - Chart visualization
- `role="list"` / `role="listitem"` - Chart levels and cards
- `role="note"` - Chart footer note

### IssuanceFilters
- `role="search"` - Search landmark
- `role="group"` with `aria-label` - Filter options group
- `htmlFor` / `id` - Label-input associations
- `aria-describedby` - Connect input to hint text

### IssuanceTabs
- `role="tablist"` - Tab list landmark
- `role="tab"` - Individual tabs
- `aria-selected` - Current tab state
- `aria-controls` - Link tabs to panels
- `tabIndex` management - Keyboard navigation

### PolicyCard
- `role="list"` / `role="listitem"` - Policy cards
- `aria-labelledby` - Connect titles to cards
- `aria-label` - Button actions

### DocumentTable
- `role="table"` - Table landmark
- `role="row"` / `role="cell"` - Table structure
- `scope="col"` - Column headers
- `aria-label` - Button actions

---

## UI Improvements

### Colors & Typography
- Modern, professional color palette (blue/grey/white DepEd-inspired)
- CSS custom properties for consistent theming
- Responsive font sizes using `clamp()`
- Improved text hierarchy (headings, subtitles, body)

### Spacing & Layout
- Consistent spacing using CSS custom properties
- Mobile-first responsive design
- Flexbox and Grid layouts for all components
- Proper padding/margins on all breakpoints

### Interactive Elements
- Button hover/focus/active states
- Input focus states with outline and shadow
- Tab keyboard navigation
- Card hover effects with transforms

### Accessibility
- Proper focus indicators
- ARIA roles and labels
- Screen reader only text
- Keyboard navigable components
- Semantic HTML elements

---

## Responsive Breakpoints

- **Mobile**: < 480px
- **Tablet**: 480px - 768px  
- **Desktop**: > 768px
- **Large Desktop**: > 1024px

All components use:
- Mobile-first approach
- `clamp()` for fluid responsive values
- Media queries for tablet and desktop

---

## Component File Structure

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.css
│   │   └── Button.jsx
│   ├── Carousel/
│   │   ├── Carousel.css
│   │   └── Carousel.jsx
│   ├── DocumentTable/
│   │   ├── DocumentTable.css
│   │   └── (component in parent)
│   ├── FileExplorer/
│   │   └── FileExplorer.css
│   ├── Header/
│   │   └── Header.css
│   ├── IssuanceFilters/
│   │   ├── IssuanceFilters.css
│   │   └── (component in parent)
│   ├── IssuanceHeader/
│   │   ├── IssuanceHeader.css
│   │   └── (component in parent)
│   ├── IssuanceTabs/
│   │   ├── IssuanceTabs.css
│   │   └── (component in parent)
│   ├── Layout/
│   │   └── Layout.css
│   ├── PolicyCard/
│   │   ├── PolicyCard.css
│   │   └── (component in parent)
│   ├── QuickInfo/
│   │   └── QuickInfo.css
│   └── StatsCard/
│       └── StatsCard.css
├── pages/
│   ├── Home.css
│   ├── About.css
│   ├── OrganizationalChart.css
│   └── main-content.css
└── styles/
    └── globals.css
```

---

## Notes

- Sidebar and Header were NOT modified (as per requirements)
- All changes maintain existing functionality
- No JSX structure changes except CSS imports
- Button styles duplicated in PolicyCard and DocumentTable for independence
