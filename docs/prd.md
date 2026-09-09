# Product Requirements Document

## 1. Document Status

| Field | Value |
| --- | --- |
| Product | Sakuta |
| Document type | Product requirements baseline |
| Status | V1 implemented, with future items listed separately |
| Last updated | 2026-09-08 |
| Primary platform | Responsive web app and installable PWA |
| Primary language | Bahasa Indonesia |

## 2. Product Summary

Sakuta is a personal finance application for recording, understanding, and planning everyday finances. It gives users one place to manage wallets, transactions, categories, budgets, recurring transactions, savings goals, reports, and financial planning.

The product is designed for quick daily use on a phone while remaining comfortable for deeper review on desktop. It also supports collaborative savings goals so two people can work toward a shared target.

## 3. Problem Statement

People often split their financial information between notes, bank applications, spreadsheets, and memory. This makes it difficult to answer basic questions:

- How much money is available across all wallets?
- Where did money go this month?
- Which category is close to its budget limit?
- Is a savings goal still on track?
- What recurring expenses are coming next?

Sakuta reduces this fragmentation by turning those questions into a simple, searchable, and visual workflow.

## 4. Product Goals

- Make recording an income, expense, or transfer fast enough for daily use.
- Give users a trustworthy view of balances and monthly cash flow.
- Make spending patterns understandable through categories, budgets, and reports.
- Help users plan future obligations and savings goals.
- Provide a consistent experience across desktop, tablet, and mobile screens.
- Keep private financial data out of service-worker caches.
- Allow the application shell to load as an installable PWA without pretending that all financial actions work offline.

## 5. Non-Goals

- Replacing a bank or payment provider.
- Performing bank synchronization or automatic bank reconciliation.
- Building a full accounting or tax system.
- Providing investment, lending, or payment execution features.
- Offering offline creation or synchronization of private financial records in PWA V1.
- Adding a custom install prompt or push notification system in PWA V1.

## 6. Target Users

### Individual user

Wants to record daily spending, understand monthly cash flow, and maintain control over multiple wallets.

### Planner

Wants budgets, recurring transactions, reminders, reports, and savings projections to support future decisions.

### Collaborative saver

Wants to invite another person to manage a shared savings target with an explicit invitation and acceptance flow.

## 7. Product Principles

- Clarity over density: show the most important financial state first.
- Fast capture: minimize friction for routine transaction entry.
- Honest status: distinguish actual data, projections, simulations, and unavailable integrations.
- Safe defaults: avoid caching private data and avoid destructive actions without confirmation.
- Consistent language: use Bahasa Indonesia for primary user-facing finance terminology.
- Responsive by default: the same core task should work with touch, keyboard, and pointer input.

## 8. Information Architecture

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Entry point and redirect | Public |
| `/login` | Sign in | Public |
| `/register` | Create an account | Public |
| `/dashboard` | Financial overview and recent activity | Authenticated |
| `/wallets` | Wallets, transaction list, filters, search, and export | Authenticated |
| `/savings` | Savings goals, progress, sorting, and collaboration | Authenticated |
| `/categories` | Categories and monthly budget controls | Authenticated |
| `/reports` | Financial summaries and visual analysis | Authenticated |
| `/ai-advisor` | Financial insight experience | Authenticated |
| `/planner` | Planning workspace | Authenticated |
| `/calendar` | Scheduled financial activity | Authenticated |
| `/tasks` | Task and reminder workspace | Authenticated |

## 9. Functional Requirements

### 9.1 Authentication and session

- Users can register with name, email, password, and password confirmation.
- Users can sign in and sign out.
- Protected application routes redirect unauthenticated users to the login page.
- Authenticated users cannot remain on login or register screens.
- The session state is restored when the application starts.
- Supabase OAuth is supported when Supabase configuration is available.
- Local/demo fallback behavior is retained for development and prototype use.

### 9.2 Dashboard

- Show total balance across wallets.
- Show current-period income and expense summaries.
- Show recent transaction activity.
- Show spending trends and category allocation based on available transaction data.
- Surface budget warnings when a category approaches or exceeds its monthly limit.
- Provide a clear entry point to add a transaction.

### 9.3 Wallets and transactions

- Users can create, edit, and delete wallets.
- Wallets include a name, color, and opening balance.
- The application calculates wallet balances from opening balance and transactions.
- Users can create income and expense transactions.
- Users can edit and delete transactions with confirmation for deletion.
- Transactions support name, amount, category, wallet, date, time, and note.
- Transfers support a source wallet and destination wallet and reject the same wallet for both sides.
- Transfer records show source and destination clearly.
- Recurring transaction rules can be created, enabled, disabled, and deleted.
- Recurring transactions are generated according to their schedule and must not duplicate the same occurrence.
- Filter controls support date range, category, and transaction type.
- Filtered transactions can be exported as CSV.
- Pagination is applied to the transaction list.

### 9.4 Search

- The global search field accepts a query from the authenticated layout.
- Search queries are normalized case-insensitively and split into terms.
- A query can match savings goals, wallets, transactions, and categories.
- A savings-goal-only match routes to `/savings?q=<query>`.
- Other matches route to `/wallets?q=<query>`.
- Wallet search can match transaction title, note, type, category, wallet, transfer source, and transfer destination.
- Search results must not be limited to the default recent-date filter.
- Empty results must explain that no matching data was found and preserve the query context.

### 9.5 Categories and budgets

- Users can add, edit, and delete categories.
- Categories support an icon, color, type, and optional monthly budget.
- Expense usage is calculated for the current month.
- Budget status is represented as safe, approaching limit, or over limit.
- Budget warnings are visible from the dashboard, transaction area, and categories area when applicable.

### 9.6 Savings goals

- Users can create a goal with name, target amount, current amount, monthly contribution, and target date.
- Users can choose a consistent visual icon for a goal.
- Goal cards show progress toward the target.
- Goals can be viewed in running and completed states.
- Goals can be sorted by deadline, progress, or target amount.
- Goals can be deleted only after confirmation.
- Goals at 100 percent progress move to the completed state.
- Search queries can filter goals by title or collaboration partner email.
- Collaborative goals show a shared status and expose collaboration management.
- Collaboration invitations remain pending until the recipient accepts or rejects them.

### 9.7 Reports, advisor, and planning

- Reports provide a visual summary of income, expenses, categories, and trends from available data.
- The advisor surface must distinguish insight or simulation from an executed financial action.
- Planner, calendar, and task surfaces provide a place for upcoming financial work.
- These areas must not imply a live bank connection when none is configured.

### 9.8 PWA V1

- The web app provides a valid manifest with Sakuta branding.
- The app is installable when supported by the browser.
- The app uses standalone display mode and portrait-primary orientation.
- The root application shell can be served through the generated service worker fallback.
- Static application assets may be precached.
- Requests to the configured Supabase domain use `NetworkOnly` and must not be stored by Workbox.
- No authentication token, API response, transaction record, wallet balance, or other private financial data may be added to a cache strategy.
- PWA V1 does not add offline CRUD, background sync, push notifications, or a custom install prompt.

## 10. User Flows

### Record an expense

1. User opens the add transaction action.
2. User selects expense, enters amount and description, and chooses category and wallet.
3. User optionally adds date, time, and note.
4. User submits the form.
5. The new expense appears in the transaction list and updates the wallet and dashboard totals.

### Find an older transaction

1. User enters a phrase in the global search field.
2. Sakuta searches the supported finance entities without applying the default recent-date restriction.
3. Sakuta opens the relevant wallet/transaction view with the query preserved.
4. The user refines the result with category, type, or date filters if needed.

### Track a savings goal

1. User creates a goal with a target amount and date.
2. Sakuta displays the initial progress and monthly contribution context.
3. User reviews running goals and sorts them by the most useful planning dimension.
4. A fully funded goal is shown under completed goals.

### Invite a collaborator

1. User opens collaboration management on a goal.
2. User enters the other person's email.
3. Sakuta creates a pending invitation instead of immediately granting access.
4. The recipient reviews the invitation and accepts or rejects it.
5. An accepted goal becomes available to both collaborators according to the configured data model.

## 11. Non-Functional Requirements

### Privacy and security

- Never expose the Supabase service-role key in frontend code.
- Treat the Supabase anon key as a public client configuration value, not as a secret.
- Do not cache authenticated API responses in the service worker.
- Confirm destructive actions such as deleting wallets, transactions, goals, or categories.
- Production authentication must use real server-side credential handling and password hashing. Local/demo fallback is prototype behavior.

### Performance

- Production builds must complete from the `frontend/` package.
- Static assets should be served through the generated Vite build.
- Large feature surfaces should be considered for code splitting if the bundle continues to grow.
- Search should remain responsive for the expected client-side dataset size.

### Accessibility

- All form controls need visible or programmatic labels.
- Interactive controls must be keyboard reachable and have visible focus states.
- Icon-only buttons need accessible names.
- Color must not be the only way to communicate transaction type or budget status.
- Dialogs must have an accessible name and a predictable close path.
- Touch targets should remain usable on mobile screens.
- Reduced-motion preferences should be respected for non-essential animation.

### Responsive behavior

- Mobile uses a compact top bar and bottom navigation/drawer patterns where appropriate.
- Tablet and split-screen layouts use a collapsed sidebar when horizontal space is limited.
- Desktop uses the full navigation sidebar and multi-column content layouts.
- Tables must avoid clipping important amounts or actions at intermediate widths.

## 12. Success Metrics

| Area | Indicator |
| --- | --- |
| Daily utility | User can record a transaction in one short flow |
| Discoverability | Users can find a transaction or goal using global search |
| Financial clarity | Dashboard totals agree with wallet and transaction data |
| Planning | Users can create and review a savings goal and budget |
| Reliability | No duplicate recurring transaction for the same scheduled occurrence |
| Privacy | No private Supabase or finance response is present in the service-worker cache |
| Quality | Production build completes without compilation errors |

## 13. Known Limitations

- Local/demo data behavior is browser-scoped and is not a substitute for production persistence.
- Some advisor, planner, report, and savings projection experiences may still use simulated or sample content.
- Google and Apple buttons may depend on provider configuration and are not equivalent to a fully configured production OAuth deployment.
- PWA V1 does not provide offline financial writes or background synchronization.
- The main JavaScript bundle currently produces a Vite size warning above 500 kB and can be optimized later with code splitting.

## 14. Future Scope

- Bank and payment-provider integrations with explicit consent and reconciliation.
- Server-side production authentication hardening and account recovery.
- Offline-safe draft capture with conflict-aware synchronization.
- Push notifications for accepted invitations, budgets, and recurring events.
- Real financial advisor integrations with explainable, permissioned data access.
- Automated tests for calculations, search routing, filters, and collaboration permissions.
- Bundle splitting and performance budgets per route.
