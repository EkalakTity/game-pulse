# Design System — Gaming News Hub

## Brand Identity

**Product Name:** GamePulse Hub  
**Tagline:** Your central nervous system for gaming news  
**Audience:** Internal admin operators, social media managers  
**Tone:** Professional, fast, data-dense, dark-mode first

---

## Color Palette

### Semantic Tokens (CSS Custom Properties)
```css
:root {
  /* Brand */
  --color-brand-500: #6d28d9;      /* Primary violet */
  --color-brand-400: #7c3aed;
  --color-brand-300: #8b5cf6;
  --color-brand-600: #5b21b6;

  /* Neutrals */
  --color-surface-base:    #0f0f13;  /* Page background */
  --color-surface-raised:  #18181f;  /* Card background */
  --color-surface-overlay: #222230;  /* Modal, dropdown */
  --color-surface-border:  #2e2e3e;  /* Dividers, borders */

  /* Text */
  --color-text-primary:   #f1f0ff;
  --color-text-secondary: #a09ec0;
  --color-text-muted:     #6b6988;

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error:   #ef4444;
  --color-info:    #3b82f6;
}
```

### Tailwind Config Extension
```ts
// tailwind.config.ts
colors: {
  brand: {
    300: '#8b5cf6',
    400: '#7c3aed',
    500: '#6d28d9',
    600: '#5b21b6',
  },
  surface: {
    base:    '#0f0f13',
    raised:  '#18181f',
    overlay: '#222230',
    border:  '#2e2e3e',
  },
}
```

---

## Typography

| Role | Font | Size | Weight |
|---|---|---|---|
| Display | Inter | 2rem / 32px | 700 |
| Heading 1 | Inter | 1.5rem / 24px | 600 |
| Heading 2 | Inter | 1.25rem / 20px | 600 |
| Body | Inter | 0.875rem / 14px | 400 |
| Caption | Inter | 0.75rem / 12px | 400 |
| Code | JetBrains Mono | 0.8125rem / 13px | 400 |

---

## Spacing System

Uses Tailwind's default 4px base scale. Canonical spacing:
- `space-1` = 4px — icon gap, tight inline spacing
- `space-2` = 8px — element internal padding
- `space-4` = 16px — card padding, section gap
- `space-6` = 24px — major section separation
- `space-8` = 32px — page region separation

---

## Component Library (shadcn/ui base)

### Core Components
| Component | Usage |
|---|---|
| `<DataTable>` | All listing views — sortable, filterable, paginated |
| `<StatusBadge>` | Article status, post status (draft / scheduled / published / failed) |
| `<FeedCard>` | RSS source display with health indicator |
| `<ArticleCard>` | News article preview with thumbnail |
| `<ScheduleCalendar>` | Post scheduling time picker |
| `<SocialPreview>` | Platform-specific post preview (FB / TikTok / IG / LINE) |
| `<CategoryPill>` | Inline category tag with color coding |
| `<JobStatusBanner>` | System-wide queue health banner |

### State Variants for Every Interactive Component
1. **Default** — resting state
2. **Hover** — subtle surface lift + border highlight
3. **Active/Pressed** — scale-down micro-animation
4. **Focus** — visible ring using `ring-brand-400`
5. **Loading** — skeleton or spinner
6. **Disabled** — 40% opacity, no pointer events
7. **Error** — red border + error message below
8. **Success** — green border + check icon

---

## Layout System

### Admin Shell
```
┌─────────────────────────────────────────────────────────┐
│  TopNav: Logo | Search | Notifications | User Menu      │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Sidebar     │  Main Content Area                       │
│  (240px)     │  (flex-1, max-w-screen-xl, mx-auto)      │
│              │                                          │
│  > Dashboard │  ┌──────────────────────────────────┐   │
│  > Articles  │  │  Page Header + Breadcrumb         │   │
│  > Sources   │  ├──────────────────────────────────┤   │
│  > Schedule  │  │  Toolbar: Filters | Bulk Actions  │   │
│  > Social    │  ├──────────────────────────────────┤   │
│  > Settings  │  │  Content (Table / Cards / Form)   │   │
│              │  └──────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────┘
```

### Responsive Breakpoints
| Breakpoint | Width | Layout |
|---|---|---|
| `sm` | 640px | Sidebar collapses to icon-only |
| `md` | 768px | Cards switch to list view |
| `lg` | 1024px | Full sidebar + 2-column content |
| `xl` | 1280px | Max content width cap |

---

## Dashboard Page — Key Screens

### 1. Dashboard Overview
- Stats row: Total Articles | Published Today | Scheduled Posts | Active Feeds
- Chart: Article ingestion volume (7-day sparkline per source)
- Recent activity feed (last 20 events)
- Queue health widget (pending / processing / failed jobs)

### 2. Articles List
- Filterable data table: Category | Source | Status | Date
- Bulk actions: Categorize | Schedule | Archive | Delete
- Inline thumbnail preview on row hover
- Duplicate indicator badge

### 3. Feed Sources Manager
- Card grid: Source name | URL | Last fetch | Article count | Health status
- Health indicator: Green (fetched < 1h ago) | Yellow (> 6h) | Red (error)
- Add / Edit / Pause / Delete actions

### 4. Schedule Calendar
- Month/week/day view toggle
- Drag-to-reschedule posts
- Platform filter (show all / FB / TikTok / IG / LINE)
- Time slot conflict highlighting

### 5. Social Post Composer
- Article selector (search + preview)
- Platform checkboxes (multi-platform in one go)
- Caption editor with character counter per platform
- Hashtag manager
- Schedule picker or "Post Now" button
- Live preview panel per platform

---

## Motion & Animation

- **Micro-interactions:** 150ms ease-out for hover, press, toggle
- **Page transitions:** Fade-through 200ms
- **Modals:** Scale-in from 95% → 100%, 200ms ease-out
- **Toasts:** Slide-in from right, 300ms
- **Skeleton loaders:** Pulse shimmer on surface-overlay
- **Respect `prefers-reduced-motion`:** All animations disabled when set

---

## Icon System

Use `lucide-react` exclusively. Icon sizes:
- `size-4` (16px) — inline text icons
- `size-5` (20px) — button icons
- `size-6` (24px) — sidebar nav icons
- `size-8` (32px) — empty state illustrations

---

## Accessibility Checklist

- [ ] All interactive elements reachable via Tab
- [ ] Focus ring visible at all times (never `outline: none` without replacement)
- [ ] Color is never the sole differentiator — always paired with icon or text
- [ ] All images have meaningful `alt` text
- [ ] Status changes announced via `role="status"` live region
- [ ] Modals trap focus and return focus on close
- [ ] Form errors linked to inputs via `aria-describedby`
- [ ] Contrast ratio ≥ 4.5:1 for all text
