# Nivra Brand System

## Direction

Nivra is a calm, evidence-first financial utility. It should feel humane enough for a first-time borrower and rigorous enough for a lender risk team. The visual direction is warm utilitarian: paper-toned surfaces, one neem-green accent, clear containment, and restrained motion.

## Colors

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Background | `oklch(0.97 0.015 95)` | `oklch(0.15 0.018 145)` | Page canvas |
| Foreground | `oklch(0.22 0.02 125)` | `oklch(0.94 0.012 110)` | Primary text |
| Card | `oklch(0.995 0.005 95)` | `oklch(0.19 0.022 145)` | Elevated surfaces |
| Primary | `oklch(0.44 0.075 145)` | `oklch(0.72 0.11 145)` | Primary actions, trusted state |
| Muted | `oklch(0.925 0.014 95)` | `oklch(0.24 0.02 145)` | Quiet fills |
| Border | `oklch(0.84 0.018 100)` | `oklch(0.31 0.025 145)` | Structural divisions |
| Success | `oklch(0.52 0.11 145)` | `oklch(0.72 0.11 145)` | Verified state only |
| Warning | `oklch(0.67 0.12 78)` | `oklch(0.77 0.12 78)` | Demo / caution state |
| Destructive | `oklch(0.55 0.18 28)` | `oklch(0.68 0.18 28)` | Revocation and errors |

Use the primary green sparingly. No decorative gradients. Semantic colors only communicate state.

## Typography

- Product text: DM Sans, variable weight 400–700.
- Proof data and monetary values: DM Mono, weight 400–500.
- Maximum three weights per screen: 400, 500/600, 700.
- Display copy is tightly tracked; uppercase eyebrow labels are widely tracked.

## Components

- Panels use borders rather than visible shadows.
- Buttons are 44px or taller, with a smaller radius than cards.
- Cards use 16–20px radii; status chips use pill radii.
- Focus rings are visible and use the primary token.
- Data tables left-align labels and right-align numeric values.

## Voice

- Specific, plain, and non-promotional.
- Say “conditional pre-qualification,” never “loan approval.”
- State what stays private and what becomes public.
- Label simulations, mock integrations, and unaudited cryptography directly.

## Motion

- Use `cubic-bezier(0.23, 1, 0.32, 1)`.
- Page sections enter once with a short stagger.
- Respect `prefers-reduced-motion` and never block interaction on animation.

