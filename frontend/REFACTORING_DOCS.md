# REFACTORING_DOCS.md — LMS Frontend Refactoring Documentation

> **Date:** May 27, 2026  
> **Scope:** 100% Frontend (HTML, CSS, JavaScript). No backend code.  
> **Goal:** Decompose 4 monolithic HTML files into a clean, scalable folder structure with separated concerns.

---

## 1. Refactored Folder Structure

```
/frontend
├── /assets
│   ├── /css
│   │   └── style.css              ← All custom CSS extracted here
│   └── /js
│       ├── tailwind-config.js     ← Unified Tailwind configuration
│       ├── main.js                ← Shared/student-facing scripts
│       └── admin.js               ← Admin portal interactive logic
├── index.html                     ← Public Dashboard (home page)
├── course-details.html            ← Course Details page
├── login.html                     ← Login page
└── admin_portal.html              ← Admin Portal page
```

---

## 2. File Mapping (Original → Refactored)

| Original File            | New File                | Notes                                  |
|--------------------------|-------------------------|----------------------------------------|
| `Public_dashboard.html`  | `index.html`            | Renamed to standard `index.html`       |
| `Course Details.html`    | `course-details.html`   | Renamed with kebab-case (no spaces)    |
| `login_page.html`        | `login.html`            | Simplified filename                    |
| `Admin_portal.html`      | `admin_portal.html`     | Kept consistent naming                 |

---

## 3. What Was Extracted

### 3.1 Tailwind Configuration → `assets/js/tailwind-config.js`

Each original file contained a separate `<script id="tailwind-config">` block with slightly different tokens. These were **merged into a single superset** configuration:

| Source File            | Unique Tokens Contributed                                                                 |
|------------------------|-------------------------------------------------------------------------------------------|
| Public Dashboard       | `surface`, `inverse-surface`, `on-surface-variant`, `on-primary`, spacing tokens          |
| Course Details         | `error`, `error-container`, `inter` font family                                           |
| Login Page             | Full Material 3 palette (~40 colors), `fontSize`, `borderRadius`, `spacing`, semantic fonts |
| Admin Portal           | `tertiary-container` (green for attendance badges)                                        |

**Loading Order (Critical):**
```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script src="assets/js/tailwind-config.js"></script>  <!-- Must load AFTER CDN, NO defer -->
```

The Tailwind CDN creates the global `tailwind` object; the config file sets `tailwind.config` synchronously.

### 3.2 Custom CSS → `assets/css/style.css`

All `<style>` blocks from the 4 files were consolidated into one stylesheet:

| CSS Rule / Class        | Origin                | Purpose                                           |
|-------------------------|-----------------------|---------------------------------------------------|
| `body { font-family }`  | All files             | Cairo as default font                             |
| `.material-symbols-outlined` | All files        | Google Material Icons rendering settings          |
| `::-webkit-scrollbar`   | Admin Portal          | Custom thin scrollbar for the page                |
| `.carousel-container`   | Public Dashboard      | Horizontal scroll-snap for news carousel          |
| `.soft-shadow`          | Public Dashboard      | Subtle card shadow                                |
| `.card-shadow`          | Course Details        | Card shadow variant                               |
| `.interactive-card`     | Course Details        | Hover-lift effect for content cards               |
| `.drawer-scroll`        | Public Dashboard      | Narrow scrollbar inside the side drawer           |
| `.bg-mesh-pattern`      | Login Page            | Decorative dot-grid overlay on branding panel     |
| `@keyframes scale-in`   | Admin Portal          | Modal/panel entrance animation                    |
| `.animate-scale-in`     | Admin Portal          | Animation utility class                           |

**Body Background Handling:**  
Each page originally set a different `background-color` via CSS. Since a single CSS file can't serve page-specific body backgrounds, these are now handled via **Tailwind classes on each page's `<body>` element**:

| Page                 | Tailwind Class          | Color     |
|----------------------|-------------------------|-----------|
| `index.html`         | `bg-surface`            | `#f8f9ff` |
| `course-details.html`| `bg-surface-alt`        | `#F9FAFB` |
| `admin_portal.html`  | `bg-[#F4F5F7]`          | `#F4F5F7` |
| `login.html`         | `bg-surface-container-lowest` | `#ffffff` |

### 3.3 JavaScript → `assets/js/main.js` + `assets/js/admin.js`

#### `main.js` — Shared / Student-Facing Logic
Extracted from `Public_dashboard.html` (lines 351–434):

| Feature                       | Description                                                  |
|-------------------------------|--------------------------------------------------------------|
| Side Drawer Toggle            | Open/close hamburger menu with backdrop and scroll lock      |
| Password Form Accordion       | Expand/collapse password change section with visual feedback |

#### `admin.js` — Admin Portal Logic
Extracted from `Admin_portal.html` (lines 352–534):

| Feature                       | Description                                                  |
|-------------------------------|--------------------------------------------------------------|
| Tab Switching                  | Toggle between "Users" and "Course Files" tabs              |
| Add Student Modal              | Open/close modal with backdrop, includes password generator |
| QR Attendance Modal            | Open/close, generate QR codes, live polling simulation      |
| Course Builder                 | New course input, add content form, new section form toggles |

**Pages With No JavaScript:**
- `course-details.html` — Pure static page, no interactive scripts in original
- `login.html` — Pure static page, no interactive scripts in original

---

## 4. How Files Are Linked

### Unified `<head>` Template (used by all 4 pages)

```html
<!-- 1. Tailwind CDN (must load first) -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>

<!-- 2. Tailwind Config (synchronous, immediately after CDN) -->
<script src="assets/js/tailwind-config.js"></script>

<!-- 3. Google Fonts (unified import) -->
<link href="https://fonts.googleapis.com" rel="preconnect">
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect">
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800
  &family=Inter:wght@400;500;600;700
  &family=JetBrains+Mono:wght@400
  &family=Material+Symbols+Outlined:wght,FILL@100..700,0..1
  &display=swap" rel="stylesheet">

<!-- 4. Shared Stylesheet -->
<link rel="stylesheet" href="assets/css/style.css">
```

### JavaScript Linking (at bottom of `<body>`)

| Page                  | Script Tag                                          |
|-----------------------|-----------------------------------------------------|
| `index.html`          | `<script src="assets/js/main.js" defer></script>`   |
| `admin_portal.html`   | `<script src="assets/js/admin.js" defer></script>`  |
| `course-details.html` | *(none — no interactive JavaScript)*                |
| `login.html`          | *(none — no interactive JavaScript)*                |

---

## 5. Improvements & Fixes Applied

| Issue                                  | Fix Applied                                            |
|----------------------------------------|--------------------------------------------------------|
| Duplicate Material Symbols import in `login_page.html` (loaded twice) | Consolidated into a single Google Fonts URL |
| Compressed HTML in `login_page.html` (all on one line) | Properly formatted with standard indentation |
| Inconsistent font-family casing (`jetbrainsMono` vs `JetBrains Mono`) | Standardized to `"JetBrains Mono"` matching Google Fonts |
| Magic strings for tab classes repeated in admin JS | Extracted to `ACTIVE_TAB_CLASSES` / `INACTIVE_TAB_CLASSES` constants |
| Magic number for password length | Extracted to `PASSWORD_LENGTH` constant |
| Magic string for password charset | Extracted to `PASSWORD_CHARSET` constant |

---

## 6. Verification Checklist

- [x] All `<style>` blocks removed from HTML files
- [x] All `<script id="tailwind-config">` blocks removed from HTML files
- [x] All interactive `<script>` blocks removed from HTML files
- [x] `style.css` contains all custom CSS from all pages
- [x] `tailwind-config.js` is a complete superset of all 4 configs
- [x] `main.js` reproduces Public Dashboard behavior identically
- [x] `admin.js` reproduces Admin Portal behavior identically
- [x] All inter-page links (`index.html`, `login.html`) are correct
- [x] No backend code, database schemas, or API routes included
- [x] Folder structure matches the required specification exactly
