# Product

## Register

product

## Users

Developers who use the Trekker CLI for local task and issue tracking. They work in terminal environments alongside editors, live in dark themes but may switch to light. Primary workflow: review task state, move things between statuses, add context, track blockers. They open this as a companion to code work, not as a primary destination — speed and low friction matter more than richness.

## Product Purpose

A visual layer over the Trekker CLI's local SQLite database. Trekker stores tasks, epics, dependencies, and comments in `.trekker/trekker.db`; this dashboard makes that data spatial and interactive. Success looks like: a developer can glance at the kanban board, understand project state in seconds, and act on it without leaving the browser tab.

## Brand Personality

Sharp, minimal, fast. Raycast and Linear are the right energy: every pixel earns its place, keyboard-first bias, zero clutter. The tool should feel like it was made by the same kind of person who uses it.

## Anti-references

- **Jira and enterprise project management tools**: bloated, icon-heavy, color-coded-everything, built for managers reporting upward rather than makers doing work.
- **Generic SaaS dashboards**: cream backgrounds, blue primary, rounded everything, shadcn defaults shipped as the final product.
- **ClickUp / Monday maximalism**: features competing for attention, color for every category, badges inside badges.

## Design Principles

1. **Signal over noise.** Every visual element carries information or affords action. Decoration is noise. If removing it wouldn't cost anything, it shouldn't be there.
2. **Structural neutrality, data gets color.** The chrome (header, borders, backgrounds) stays achromatic. Only the data itself, specifically status and priority, earns color. This makes status changes legible at a glance without the whole UI shouting.
3. **Speed reads first.** Title, status, and priority are visible before the eye travels. Supporting details (description, tags, dates) are secondary and should visually recede.
4. **Both themes are first-class.** Dark and light are equal; neither is an afterthought. A developer who switches themes mid-session should land in something equally considered.
5. **Keyboard before mouse.** Layout and focus order assume tab navigation. Pointer interactions are enhancements, not requirements.

## Accessibility & Inclusion

Maintain existing accessibility behavior. No new compliance targets, but no regressions. Both themes must meet WCAG AA contrast for text. Respect `prefers-reduced-motion` for any animations added.
