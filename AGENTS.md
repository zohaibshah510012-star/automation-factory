# AI-Company Product System

This project belongs to the AI-Company product system. Reference the global Codex Skills in `D:/Users/admin/.codex/skills/`; do not copy Skill files into this repository.

## Delivery sequence

All development work follows this order when relevant:

1. `founder-operator` assesses commercial value and priority.
2. `business-strategy` defines the business objective for product or feature work.
3. `customer-research` validates user needs for customer-facing work.
4. `product-manager` defines scope, acceptance criteria, dependencies, and risks.
5. `project-architect` designs the technical solution.
6. `ai-agent-architect` designs AI systems when AI capability is involved.
7. Engineering Skills implement the scoped change: `ai-automation-engineer`, `prompt-engineer`, `ai-cost-optimizer`, and `saas-growth-engineer` when applicable.
8. `testing-engineer` verifies relevant behavior.
9. `security-engineer` performs security review; if unavailable, use global `security-best-practices`.
10. `documentation-engineer` updates durable documentation when behavior, operations, or public interfaces change.

## Large-task gate

Before any material feature, architecture, production, billing, security, or user-flow task, output:

- Goal analysis
- Product impact
- Technical approach
- Implementation plan
- Risks

Do not begin coding a large task until this gate is presented. Preserve existing project conventions and avoid re-planning already completed work.

## Default technical standard

Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Supabase, PostgreSQL, GitHub, Vercel, and pnpm.

## Engineering safeguards

- Keep credentials server-only; never commit or print secrets.
- Use strict TypeScript, scoped migrations, RLS-aware data access, and proportionate tests.
- Do not deploy, publish, or make paid external calls without explicit user authorization.
- Preserve unrelated working-tree changes.
