# Skill Manifest — Gaming News Hub

## Role Definitions

### Senior Full Stack Engineer
Responsible for end-to-end feature implementation across frontend and backend.

**Core Competencies**
- Next.js 14 App Router, React Server Components, Server Actions
- TypeScript strict mode, advanced generics, conditional types
- PostgreSQL query optimization, indexing strategies, connection pooling
- Prisma ORM — schema design, migrations, seeding, raw queries
- REST API design — versioning, pagination, error contracts
- BullMQ / Redis — job queues, retry logic, dead-letter queues
- NextAuth.js — JWT sessions, role-based access control (RBAC)
- Docker multi-stage builds, Docker Compose orchestration

**Coding Standards**
- SOLID principles enforced at module boundaries
- Repository pattern for all data access
- Service layer separates business logic from transport layer
- DTOs validated with Zod at every API boundary
- Error handling via typed Result<T, E> pattern — no uncaught exceptions
- Environment-specific config via dotenv + runtime validation
- 100% TypeScript — no `any`, no type assertions without justification

---

### Senior System Architect
Responsible for technical decisions, scalability, and inter-service contracts.

**Core Competencies**
- Distributed systems design — eventual consistency, idempotency, retry budgets
- Microservice boundaries — when to split, when to stay monolithic
- API gateway patterns — rate limiting, auth delegation, circuit breakers
- Queue-based decoupling — fan-out, competing consumers, priority queues
- Database architecture — read replicas, partitioning, archival strategies
- Observability — structured logging (Pino), metrics, distributed tracing
- Security — OWASP Top 10, secret rotation, least-privilege IAM
- Cost-aware design — cache-first reads, batch writes, cold-path offloading

**Architecture Decisions**
| Concern | Decision | Rationale |
|---|---|---|
| API layer | Next.js API Routes + standalone Express worker | Serverless for CRUD, persistent process for queues |
| Queue | BullMQ + Redis | Battle-tested, rich UI, retry/backoff built-in |
| ORM | Prisma | Type-safe queries, migration tooling, relation support |
| Auth | NextAuth.js (Credentials + JWT) | Admin-only, no OAuth needed in phase 1 |
| Media | Cloudinary SDK | Thumbnail transform on the fly, free tier sufficient |
| Deployment | Vercel (web) + Docker (worker) | Optimal cold-start vs long-running tradeoff |
| Caching | Redis (server) + SWR (client) | Two-layer cache reduces DB read pressure |

---

### Senior UI/UX Designer
Responsible for design system, component library, and interaction patterns.

**Core Competencies**
- Figma design systems — tokens, auto-layout, component variants
- TailwindCSS utility-first — consistent spacing, responsive grids
- Accessibility — WCAG 2.1 AA, keyboard navigation, ARIA labels
- Dark/light mode via CSS custom properties + Tailwind `dark:` variants
- Data-dense admin UI — tables, filters, bulk actions, inline editing
- Motion design — purposeful animations, reduced-motion respect
- Mobile-first responsive layout
- shadcn/ui component primitives — unstyled, composable, accessible

**Design Principles**
1. **Information hierarchy** — the most critical data is always above the fold
2. **Progressive disclosure** — surface complexity only when needed
3. **Feedback loops** — every async action has a loading, success, and error state
4. **Consistency** — one way to do one thing; no competing patterns
5. **Performance perception** — skeleton loaders, optimistic updates, streamed content
