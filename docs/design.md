# Sakuta Design System and Interface Specification

## 1. Design Direction

Sakuta should feel like a calm personal finance workspace: trustworthy, light, and practical without looking like an accounting spreadsheet. The visual language uses warm off-white backgrounds, clean white surfaces, emerald brand accents, rounded cards, and compact data views.

The interface should communicate financial status quickly, then offer detail progressively. Numbers are prominent, but the surrounding UI should remain quiet enough that users can focus on the decision they are making.

## 2. Design Principles

- Calm confidence: use restrained color and clear hierarchy instead of visual noise.
- One strong action: every page should make its primary next step obvious.
- Scan before reading: summaries, badges, icons, and spacing should support a quick glance.
- Data with context: every amount should have a label, period, or category context.
- Consistent interaction: the same modal, button, badge, and filter behavior should be reused.
- Mobile parity: mobile is a first-class workflow, not a narrow desktop afterthought.
- Honest visual status: projections, sample content, and actual records must not look identical when that distinction matters.

## 3. Brand and Color Tokens

Use CSS custom properties from `frontend/src/index.css` as the source of truth. Do not introduce one-off colors for individual components unless a semantic token is missing.

| Token | Value | Usage |
| --- | --- | --- |
| `--color-page` | `#f7faf8` | Application background |
| `--color-surface` | `#ffffff` | Cards, panels, modals |
| `--color-surface-soft` | `#f3f7f4` | Soft panel and selected background |
| `--color-ink` | `#18211c` | Primary text and headings |
| `--color-muted` | `#748078` | Secondary text and metadata |
| `--color-subtle` | `#526158` | Supporting text |
| `--color-line` | `#dce6df` | Borders and dividers |
| `--color-brand` | `#0e6c4a` | Primary emerald action and active state |
| `--color-brand-dark` | `#0a4d35` | Hover, pressed, and high-emphasis brand state |
| `--color-brand-soft` | `#e8f3ed` | Brand-tinted surfaces |
| `--color-positive` | `#11804f` | Income, success, healthy progress |
| `--color-danger` | `#d94c4c` | Expense, destructive action, over-budget state |
| `--color-warning` | `#c48619` | Approaching budget limit |
| `--color-info` | `#3c7fd3` | Transfers and informational state |
| `--color-ai` | `#8b5cf6` | AI/advisor-specific accent only |

### Color rules

- Use emerald for primary actions and navigation state, not for every decorative element.
- Use green and red for income and expense only with text or icon context.
- Use blue for transfers so they are distinct from income and expense.
- Use warning and danger states for budget thresholds with labels, not color alone.
- Keep text contrast readable against both white and soft surfaces.

## 4. Typography

- Primary family: `Outfit`, with `Inter` or a system sans fallback where appropriate.
- Page titles: bold, compact, high contrast, and usually between 24 and 32 px depending on viewport.
- Section titles: semibold, usually between 16 and 20 px.
- Body text: regular, around 14 to 16 px.
- Financial amounts: semibold or bold; use `whitespace-nowrap` so values never break across lines.
- Supporting metadata: 12 to 14 px with muted color.
- Uppercase badges: small size, semibold weight, and increased letter spacing.

Avoid mixing multiple unrelated type families. Use weight and size to establish hierarchy before adding color.

## 5. Layout and Spacing

- Page background is `--color-page`.
- Main content uses a centered max-width container with responsive horizontal padding.
- Cards use white surfaces, a subtle border, and a restrained shadow.
- Card corners are rounded but should remain more functional than ornamental.
- Use a consistent 4 px spacing base; common gaps are 8, 12, 16, 24, and 32 px.
- Align card headers, table columns, and summary values to shared content edges.
- Avoid absolute positioning for information that must grow with content.

## 6. Application Shell

### Desktop

- The authenticated shell has a persistent left sidebar and a top utility bar.
- The sidebar contains the Sakuta mark, user identity, primary navigation, and secondary actions.
- The active route uses the brand emerald state and a clear icon/text treatment.
- The top bar contains global search and account or notification actions.

### Tablet and split-screen

- At constrained desktop widths, the sidebar collapses to an icon-first presentation.
- Icons remain centered and retain accessible labels or tooltips.
- Main content must retain usable horizontal padding and must not be squeezed into clipped cards.

### Mobile

- Prioritize the page title, primary action, search/filter controls, and key summary.
- Use the compact mobile navigation pattern already established by the authenticated layout.
- Preserve a visible active state in the same emerald family as desktop.
- Keep controls large enough for touch and allow horizontal scrolling only for intentional data regions.

## 7. Navigation and Search

- Navigation labels use Bahasa Indonesia: Dashboard, Dompet, Target Tabungan, Kategori, Laporan, Insight Pintar, Planner, Kalender, and Tugas.
- The global search field has a visible placeholder and an accessible label.
- Pressing Enter submits the query; search should not require a mouse click.
- Search results preserve the query in the URL with `q` so the destination can render the relevant filtered state.
- A savings-goal-only result opens the savings page; transaction or wallet results open the wallet page.
- Search is case-insensitive and supports multiple terms.
- Empty results should use a calm, specific message and offer a natural way to change the query.

## 8. Component Patterns

### Buttons

- Primary button: emerald fill, white text, medium-to-bold label, and a clear hover/pressed state.
- Secondary button: white or soft surface with a visible line border.
- Tertiary button: text or icon treatment for low-emphasis actions.
- Destructive button: danger color and confirmation when the action deletes data.
- Icon-only buttons must have an accessible name and a tooltip where the meaning is not obvious.

### Cards

- Use cards to group one decision or one related data set.
- Give every card a concise title and, when needed, a period or status label.
- Avoid nesting too many bordered cards inside one another.
- Keep equal-height grids only when it improves scanning; content should not be hidden to force symmetry.

### Badges

- Category badges use the category color with enough contrast for their text.
- Budget badges communicate safe, approaching, or exceeded states.
- Collaboration uses the shared green treatment and the label `Bersama`.
- Completed savings goals use a visible `Selesai` status in addition to visual progress.

### Iconography

- Use `lucide-react` for interface and category icons.
- Keep icon stroke weight and visual size consistent within one control group.
- Transaction icons should reflect the category when one is available.
- Icon borders communicate transaction semantics: green for income, red for expense, and blue for transfer.
- Decorative SVG charts are allowed; do not use raw inline SVG as a replacement for a standard interface icon when a Lucide icon exists.

### Forms and modals

- Group related fields and show labels above controls.
- Use explicit helper text for amount, date, recurring schedule, or collaboration behavior when ambiguity is possible.
- Validate required fields before submission and keep errors close to the relevant field.
- Preserve entered values when a submission fails.
- Modals need an accessible title, predictable close behavior, and a keyboard-safe focus path.

### Tables and transaction rows

- Keep dates and amounts aligned consistently between header and body.
- Amounts must not wrap.
- Use a compact icon, title, metadata, category badge, wallet context, and amount hierarchy.
- Show edit and delete actions without making the row feel crowded.
- At narrow widths, prioritize the transaction identity and amount before secondary metadata.

### Charts

- Charts use the brand palette and semantic colors, with enough surrounding whitespace.
- Labels and legends must explain actual versus projected values.
- A chart is supporting evidence, not the only place where a number is communicated.
- Hover or focus details must not be the only way to access important information.

## 9. Page-Specific Composition

### Dashboard

- Lead with total balance and current-period cash-flow summaries.
- Follow with trend and allocation views, then recent activity and budget alerts.
- Keep the add-transaction action easy to find without competing with the primary financial summary.

### Wallets

- Show wallet cards before the transaction table when space allows.
- Keep search and filters in one coherent control area.
- Make date, category, type, pagination, and CSV export discoverable but secondary to the transaction list.

### Savings goals

- Use a balanced grid on desktop and a single-column flow on small screens.
- Show target name, icon, progress, amount, deadline, and collaboration state on the card.
- Keep running/completed tabs and sort controls near the grid heading.
- Use the search query in the empty state so users understand what was searched.

### Categories

- Show category identity, monthly budget, actual usage, and status together.
- Keep add/edit/delete controls close to the category they affect.
- Budget warnings should be visible without requiring users to inspect a chart.

## 10. Responsive Breakpoints

| Range | Layout behavior |
| --- | --- |
| Below 640 px | Mobile shell, single-column cards, stacked forms, touch-first controls |
| 640 to 1023 px | Collapsed sidebar where needed, flexible cards, compact table behavior |
| 1024 to 1279 px | Full desktop navigation when space permits, two-column wallet and goal layouts |
| 1280 px and above | Full content width, multi-column grids, expanded data presentation |

The exact breakpoint should follow the existing CSS behavior in `frontend/src/index.css`; components must still behave correctly between these ranges rather than relying only on nominal device sizes.

## 11. Interaction and State Design

Every data-driven surface should account for these states:

- Loading: show a stable placeholder without shifting the entire page.
- Empty: explain what is missing and provide the most useful next action.
- Search empty: state that no item matched the query and keep the query visible.
- Validation error: identify the field and explain how to fix it.
- Save success: confirm the action without blocking the next task.
- Save failure: preserve input and explain whether retrying is safe.
- Destructive confirmation: name the item and explain the consequence.
- Permission or collaboration pending: distinguish pending from accepted access.
- Offline or unavailable backend: avoid claiming that a write succeeded.

## 12. Accessibility Requirements

- Use semantic landmarks for sidebar, navigation, main content, and dialogs.
- Provide labels for search, filters, amount inputs, dates, and select controls.
- Ensure keyboard users can reach every navigation item, action, menu, and modal control.
- Keep focus visible against the page and surface colors.
- Announce validation, save, and error messages in a way assistive technology can detect.
- Do not rely on red, green, blue, or purple alone to convey meaning.
- Respect `prefers-reduced-motion` for pulsing notifications, transitions, and decorative movement.
- Keep interactive touch targets approximately 44 px or larger when practical.

## 13. PWA Design Constraints

- Use the existing Sakuta logo as the source for favicon, manifest icons, and Apple touch icon.
- Manifest display mode is `standalone`; orientation is `portrait-primary`.
- Use the page and brand colors in the manifest so the launch experience matches the app shell.
- Support safe-area padding on devices with a home indicator or display cutout.
- The service worker may precache static assets only.
- Supabase requests and private finance responses stay network-only.
- Do not design UI that depends on a custom install banner, push permission, or offline write queue in V1.

## 14. Source of Truth

| Concern | Source |
| --- | --- |
| Global design tokens and responsive shell | `frontend/src/index.css` |
| Authenticated layout, navigation, and global search | `frontend/src/layouts/AuthenticatedLayout.jsx` |
| Application routes and PWA registration | `frontend/src/app.jsx` |
| PWA manifest and Workbox policy | `frontend/vite.config.js` |
| HTML metadata and install icons | `frontend/index.html` and `frontend/public/` |
| Transaction presentation | `frontend/src/features/dashboard/components/TransactionRow.jsx` |
| Wallet and transaction search/filter behavior | `frontend/src/features/wallets/MultiWallet.jsx` |
| Savings-goal presentation and search behavior | `frontend/src/features/savings/SavingsGoals.jsx` |

When this document and the implementation diverge, update the document or explicitly record the product decision before introducing a new visual pattern.
