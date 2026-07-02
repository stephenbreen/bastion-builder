# Bastion Planner

A web-based stronghold/bastion tracker for D&D 5e (2024) campaigns, blending rules from the DMG 2024 Bastions, MCDM's Strongholds & Followers and Kingdoms & Warfare (domains/intrigue), Xanathar's downtime activities, and the Steel Compendium's downtime projects.

See [`REQUIREMENTS.md`](REQUIREMENTS.md) for the full design and [`BUILD_PLAN.md`](BUILD_PLAN.md) for the phased implementation plan.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- Zustand (state, with `persist` to localStorage)
- Vitest (unit tests)

## Develop

```sh
pnpm install
pnpm dev      # local dev server
pnpm build    # production build
pnpm test     # vitest
```

## Source rules

The source rule references live in [`source-rules/`](source-rules/) and are for local reference while authoring the homebrew system. They are not redistributed.
