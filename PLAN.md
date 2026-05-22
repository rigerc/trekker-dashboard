# Fix: Missing Settings Button in App Header

## Context

The Settings button (⚙️ SlidersHorizontal icon) in the app header is conditionally hidden. It only renders when `projectConfig` is truthy, but there are scenarios where `projectConfig` is `undefined`, making the entire Settings dialog — including local user preferences — inaccessible.

## Root Cause

In `src/client/hooks/use-data.ts`, the `useProject()` hook was modified (commit `8026160` — multi-project dashboard) to provide `initialData`:

```ts
let initialData: Project | undefined;
if (openProject) {
  initialData = {
    id: openProject.id,
    name: openProject.name,
    config: undefined,  // ← problem
  } as unknown as Project;  // ← type lie
}
```

This `initialData` streams `config: undefined` to consumers before the API responds. In `AppHeaderActions`, the Settings button is gated on `projectConfig` truthiness:

```tsx
const projectConfigButton = projectConfig && (
  <Button size="sm" variant="outline" onClick={onProjectConfigClick}>
    <SlidersHorizontal className="h-4 w-4" />
    <span className="hidden sm:inline ml-1">Settings</span>
  </Button>
);
```

This causes the Settings button to disappear during any render where `project.config` is undefined — including the initial loading period and any state where the query resets or fails. Even a brief flash is a visible UX bug.

### Wider Impact

The `ProjectConfigDialog` (behind the Settings button) contains **both** server-side project config (ID prefixes) **and** local user preferences (card density, default page, etc.). Gating the button on `projectConfig` prevents access to **all settings**, including purely local ones that don't need a server round-trip.

Additionally, the Save button inside the dialog is disabled when `projectConfig` is falsy:

```tsx
<Button type="submit" disabled={isPending || !projectConfig} ...>
```

This means even if the dialog were somehow opened, the prefix settings couldn't be saved.

## Approach

**Always show the Settings button** and decouple it from `projectConfig` availability:

1. **`AppHeaderActions`** — always render the Settings button; pass `projectConfig` through as an optional prop (it was already optional).
2. **`useProject()`** — fix the `initialData` so `config` isn't a type lie. Either omit config entirely from `initialData` (let it be `undefined` naturally) or provide a fallback empty config. Since `ProjectConfig` on the client just has 3 string fields, we can provide empty-string defaults that the form can handle.
3. **`use-project-config-form.ts`** — the form already handles undefined `projectConfig` gracefully via `projectConfig?.issuePrefix ?? ''`, so no changes needed there.
4. **`ProjectConfigDialog`** — disable only the prefix-related Save pathway when `projectConfig` is unavailable, not the entire Save button. The preferences section works independently via `setPreferences()`.

## Files to Modify

- `src/client/components/app-header-actions.tsx` — Remove conditional rendering of Settings button.
- `src/client/components/project-config-dialog.tsx` — Adjust Save button: always allow saving preferences; disable prefix save only when `projectConfig` is missing.
- `src/client/hooks/use-data.ts` — Fix `useProject()` initialData type safety.

## Reuse

- The `SettingsDialog` wrapper (`src/client/components/settings-dialog.tsx`) already bridges `AppHeader` to `ProjectConfigDialog` — no changes needed there.
- `use-project-config-form.ts` already handles undefined projectConfig with `??` fallbacks — no changes needed.
- The `ProjectConfig` type from `@/lib/types` remains as-is.

## Steps

- [ ] In `app-header-actions.tsx`, remove the `projectConfig &&` guard from the Settings button. Always render it.
- [ ] In `project-config-dialog.tsx`, change the Save button's disabled logic: allow saving when preferences are dirty even without `projectConfig`. At minimum, remove the `!projectConfig` disable condition and let the form submission handle it gracefully.
- [ ] In `use-data.ts`, fix `useProject()` initialData to be type-safe. Remove `as unknown as Project` and instead create a proper partial type or omit the `config` field and let `Project` type accommodate undefined config.
- [ ] Verify that the Settings button appears on initial load before the API responds.

## Verification

1. Load the app — Settings button should be visible immediately, even during the loading state.
2. Open Settings dialog — prefix fields should show placeholder values when `projectConfig` is undefined, and populate once loaded.
3. Save preferences (card density, default page, etc.) — should work regardless of `projectConfig` availability.
4. Save prefix settings — should work once `projectConfig` is loaded from the API.
5. Switch projects — Settings button should remain visible throughout the transition.