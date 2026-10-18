# SadakSetu Brand System

## Direction

SadakSetu is a calm, evidence-first civic utility. It should feel safe enough for an anonymous citizen report and rigorous enough for a municipal operations team. The visual direction is Indian civic night-board modernism: a flat near-black oxblood field, exact warm yellow, exact white, crisp bordered surfaces, road-marking geometry, stamped verification marks, clear containment, and restrained motion. Indian character comes from material, geometry, rhythm, and language—not stock imagery, monuments, flags, festival decoration, or sepia nostalgia.

## Colors

| Role | Color | Use |
| --- | --- | --- |
| Background | `#160F10` | Solid near-black oxblood site canvas |
| Foreground | `#FFFFFF` | Exact white primary text |
| Card | `#211718` | Deep oxblood fieldboard surfaces |
| Primary | `#FFD28E` | Exact warm-yellow actions and highlighted words |
| Secondary | `#2A1D1F` | Supporting surfaces |
| Muted | `#2B2021` | Quiet sections |
| Border | `#4C3638` | Structural divisions |
| Success | `#8BD6AE` | Verified and resolved states |
| Warning | `#FFD28E` | Attention and pending states |
| Destructive | `#EF6B6B` | Revocation and errors |
| Editorial | `#FFD28E` | Eyebrows, print rules, and narrative labels |

Use the oxblood-black canvas as the dominant atmosphere. Narrative text is either exact `#FFFFFF` or exact `#FFD28E`; dark text is reserved for yellow controls and banners where contrast requires it. Neem green remains semantic success. Do not use gradients—the platform gets depth from solid fields, borders, scale, and spacing.

## Typography

- Product text: DM Sans, variable weight 400–700.
- Record identifiers, counts, and timestamps: DM Mono, weight 400–500.
- Maximum three weights per screen: 400, 500/600, 700.
- Display copy is tightly tracked; uppercase eyebrow labels are widely tracked.

## Components

- Panels use borders rather than visible shadows.
- Buttons are 44px or taller, with a smaller radius than cards.
- Cards use 16–20px radii; status chips use pill radii.
- Focus rings are visible and use the primary token.
- Operations tables left-align labels and right-align numeric values.
- Shared shell dividers may use a quiet block-print rule; avoid decorative motifs inside forms and data tables.
- Narrative panels may use double fieldbook borders and stamped verification marks.
- Do not depend on Indian people, monuments, flags, or festival imagery to communicate the identity—the interface itself must carry it.

## Voice

- Specific, plain, and non-promotional.
- State what stays private and what becomes public.
- Put emergency action before product interaction for accidents.
- Label simulations, mock authority integrations, and unaudited cryptography directly.

## Motion

- Use `cubic-bezier(0.23, 1, 0.32, 1)`.
- Page sections enter once with a short stagger.
- Respect `prefers-reduced-motion` and never block interaction on animation.

