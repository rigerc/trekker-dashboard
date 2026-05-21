---
target: Main dashboard
total_score: 24
p0_count: 0
p1_count: 2
timestamp: 2026-05-21T22-53-18Z
slug: src-client-pages-kanban-page-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Loading and error states exist, but drag/status changes have no explicit success or failure feedback. |
| 2 | Match System / Real World | 3 | Kanban, List, History, task IDs, and priorities fit developer workflows; `TODO` and `P1` assume familiarity but are acceptable for this audience. |
| 3 | User Control and Freedom | 2 | Users can open details and confirm archive, but there is no visible undo for drag moves or bulk archive. |
| 4 | Consistency and Standards | 3 | App shell and controls are mostly coherent; epic cards use a noticeably different blue treatment from otherwise neutral chrome. |
| 5 | Error Prevention | 2 | Archive confirmation and invalid epic drops help, but accidental drag status changes are easy and not recoverable inline. |
| 6 | Recognition Rather Than Recall | 2 | Primary navigation is labeled, but column actions are icon-only and filtering is hidden behind a sliders icon. |
| 7 | Flexibility and Efficiency | 2 | The layout suits mouse-driven triage, but no keyboard shortcuts, command hints, or bulk operations are visible. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean, low-noise surface; card interiors become dense quickly and repeated card structure flattens priority. |
| 9 | Error Recovery | 2 | Page-level error is clear enough, but recovery guidance is generic and mutation failures are not surfaced near the action. |
| 10 | Help and Documentation | 1 | No visible contextual help, shortcut reference, or empty-state guidance beyond `Nothing here`. |
| **Total** | | **24/40** | **Acceptable: solid foundation, but key workflow confidence gaps remain.** |

#### Anti-Patterns Verdict

**Does this look AI-generated?** Not immediately. The dashboard is restrained, functional, and familiar in a Linear/Raycast-adjacent way. The strongest slop tell is not visual extravagance, it is unfinished product confidence: icon-only actions, generic empty states, no visible recovery model, and cards that repeat the same structure until the board becomes a stack of similar blocks.

**LLM assessment**: The app has good bones: neutral shell, clear route labels, predictable kanban columns, and compact task metadata. The weak spots are hierarchy and confidence. The card layout gives ID, title, priority, tags, dependencies, subtasks, and age nearly equal treatment. The board tells me what exists, but not what deserves attention first. The interaction model also assumes the user already knows drag is the primary status-change mechanism.

**Deterministic scan**: The automated detector returned `[]`, no findings, for `src/client/pages/kanban-page.tsx`, `src/client/components/kanban`, and the app header/navigation components. No banned patterns, obvious AI-slop signatures, or scan-detectable layout issues were reported. This did not catch the product issues above because they are interaction and hierarchy problems rather than static anti-patterns.

**Visual overlays**: No browser automation tool is available in this session, so no reliable user-visible overlay was injected. Fallback signal used: source review plus deterministic CLI scan.

#### Overall Impression

This is a credible developer tool dashboard, but it currently behaves more like a tidy data viewer than a high-confidence task cockpit. The single biggest opportunity is to make the board communicate “what changed, what matters, and what can I safely do next” without requiring the user to inspect every card.

#### What's Working

1. **The core IA is instantly legible.** Kanban, List, and History are plain labels with standard icons. A developer understands the map within seconds.
2. **The restrained chrome fits the product.** Header, footer, borders, and navigation stay neutral. This matches the principle that data, not decoration, gets emphasis.
3. **Column-level filtering is a good power-user seed.** Per-column sort/type filtering is useful for dense boards without forcing a global filter mental model.

#### Priority Issues

**[P1] Drag status changes lack confidence and recovery**
- **Why it matters**: Moving a task across columns changes project state. Today the UI supports the move, but does not visibly confirm success, expose failure near the card, or offer undo. A developer doing rapid triage can accidentally change state and keep going without noticing.
- **Fix**: Add an inline/toast confirmation after drag updates with an Undo action. If the update fails, restore the card and show a precise failure message. Consider a subtle “Moved to In Progress” state pulse on the destination card.
- **Suggested command**: `$impeccable harden`

**[P1] Card hierarchy does not answer “what needs attention?”**
- **Why it matters**: Every card starts with ID + priority, then title, then optional metadata. On busy boards this creates a uniform texture. Users must read too much before knowing which items are blocked, urgent, stale, or part of an epic.
- **Fix**: Establish stronger hierarchy: title first or visually dominant, priority as a compact but high-signal affordance, dependencies/blockers as a clearer risk row, and age/staleness as secondary. Use density rules so optional metadata does not overpower the task title.
- **Suggested command**: `$impeccable layout`

**[P2] Column actions are too implicit**
- **Why it matters**: Sliders, archive, and plus icons are efficient once learned, but first-time or distracted users must hover or guess. On touch/mobile, titles do not help.
- **Fix**: Keep icon buttons for density, but add accessible labels, consider visible text for the primary add action on wider columns, and make active filters more descriptive than a small dot.
- **Suggested command**: `$impeccable clarify`

**[P2] Empty states are accurate but unhelpful**
- **Why it matters**: `Nothing here` is a dead end. Empty columns are opportunities to teach workflow: add a task, drag work here, or explain what a completed/won't-fix column means.
- **Fix**: Replace generic empty copy with column-specific, low-noise guidance. Example: `No active work` with a small `Add task` affordance in TODO, or `Drop finished tasks here` in Completed.
- **Suggested command**: `$impeccable onboard`

**[P2] Epic cards break the neutrality rule**
- **Why it matters**: Epics use blue backgrounds while the product principle says structural chrome stays achromatic and data earns color. The blue card treatment makes epics feel like a separate decorative category rather than a structured work item.
- **Fix**: Bring epic cards back into the neutral system. Differentiate with an icon, progress strip, label, or typography, not a saturated blue surface.
- **Suggested command**: `$impeccable colorize`

#### Persona Red Flags

**Alex (Power User)**
- Primary board actions are mouse-forward. Drag-and-drop exists, but no visible keyboard shortcuts or command palette hints are present for status moves, opening detail, creating tasks, or archiving completed items.
- Column filters are useful, but they are per-column only. Alex cannot quickly apply a board-wide view such as “show blocked P1 tasks across all statuses.”
- Bulk archive exists only for completed items. There is no visible batch action path for selecting multiple tasks or mass-moving status.

**Sam (Accessibility-Dependent User)**
- Drag-and-drop status movement is unlikely to be equivalent for keyboard-only users unless @dnd-kit keyboard sensors are configured elsewhere. In `KanbanBoard`, only `PointerSensor` is registered.
- Icon-only column actions rely on `title` attributes, which are not a robust accessible naming or touch strategy. Use `aria-label` at minimum.
- Priority badges use color plus compact `P1/P2` text. The text helps, but labels like “High” are only in `title`, which screen reader and touch behavior may not expose reliably.

**Jordan (First-Timer)**
- The board is understandable, but the actions inside each column require guessing. Sliders means sort/filter, archive means archive all completed only in one column, plus means create in this status.
- Empty columns say `Nothing here`, not what the user can do next.
- `Won't Fix`, `P1`, and task IDs are fine for developers, but there is no inline explanation for someone opening a Trekker project for the first time.

#### Minor Observations

- `Loading...` is plain and centered. A skeleton board would better preserve layout and reduce perceived wait.
- The footer count is useful, but it competes weakly with connection status. If connection matters, give it a clearer state label.
- Card hover uses ring only; clickable affordance could be clearer without adding noise.
- Column width is predictable, but on small screens the board becomes one-column horizontal paging. That is workable, but the add/filter controls become more important and should be touch-comfortable.
- The completed-column archive action appears only when `totalCount > 0`, which is good, but its consequence is big enough that the trigger could be more explicit than an archive icon.

#### Questions to Consider

- What should the board make impossible to miss: priority, blockers, stale work, or ownership?
- Should status changes feel instant and reversible, or deliberate and confirmed?
- What would a confident empty column teach in five words?
- Is an epic a different kind of card, or the same card with progress context?
