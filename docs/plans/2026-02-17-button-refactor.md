# Button Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor raw `<button>` tags to use the `Button` component in specified files to maintain consistency and leverage the UI library.

**Architecture:** Replace native HTML `<button>` elements with the `Button` component from `@/components/ui/button`. Preserve existing styles and functionality.

**Tech Stack:** React, TypeScript, Tailwind CSS, Radix UI (via `Button` component).

---

### Task 1: Refactor SignInDialog

**Files:**
- Modify: `src/components/SignInDialog.tsx`

**Step 1: Check for existing tests**
Run: `grep -r "SignInDialog" src` (to see usages, though we likely won't add unit tests for this simple refactor unless critical)

**Step 2: Modify `src/components/SignInDialog.tsx`**
Replace the close button (lines 21-27) with `<Button>`.
- Use `variant="ghost"` and `size="icon"`.
- Preserve `onClick={onClose}`.
- Preserve `className` (removing manual padding/border if `Button` handles it, or keep `absolute top-4 right-4`).
- Ensure `type="button"` is passed if needed (Button defaults to submit? No, check implementation. Button passes props, but usually `type` defaults to `submit` in HTML forms. It's safe to be explicit).

```tsx
<Button
    variant="ghost"
    size="icon"
    onClick={onClose}
    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
>
    <X className="h-5 w-5" />
</Button>
```

**Step 3: Verify build**
Run: `pnpm build` (or relevant build command) to ensure no type errors.

**Step 4: Commit**
```bash
git add src/components/SignInDialog.tsx
git commit -m "refactor(ui): use Button component in SignInDialog"
```

---

### Task 2: Refactor BundlePicker

**Files:**
- Modify: `src/components/BundlePicker.tsx`

**Step 1: Import Button**
Add `import { Button } from "./ui/button";` to imports.

**Step 2: Modify bundle list item (lines 108-133)**
Replace the `<button>` used for search results.
- It's a list item that is clickable.
- Use `variant="ghost"`.
- `className="w-full justify-start h-auto ..."` (Button defaults to center, need justify-start for list items).
- Pass `type="button"`.

**Step 3: Modify remove button (lines 215-221)**
Replace trash icon button.
- Use `variant="ghost"` and `size="icon"`.
- Preserve `onClick`.

**Step 4: Modify expand button (lines 223-229)**
Replace chevron button.
- Use `variant="ghost"` and `size="icon"`.
- Preserve `onClick`.

**Step 5: Verify build**
Run: `pnpm build`

**Step 6: Commit**
```bash
git add src/components/BundlePicker.tsx
git commit -m "refactor(ui): use Button component in BundlePicker"
```

---

### Task 3: Refactor ToolPicker

**Files:**
- Modify: `src/components/ToolPicker.tsx`

**Step 1: Verify Button import**
It is already imported.

**Step 2: Modify "Create one?" link (line 141)**
Replace `<button>` with `<Button variant="link" ...>`.
- Adjust styling to match `text-cyan-400`. `variant="link"` might have specific styles, so might need to override or use `variant="ghost"` with specific text color.
- Check if `variant="link"` forces underline.

**Step 3: Modify tool list item (lines 153-180)**
Similar to BundlePicker.
- Use `variant="ghost"`.
- `className="w-full justify-start h-auto ..."`.
- Pass `type="button"`.

**Step 4: Modify remove and expand buttons (lines 325-339)**
- Use `variant="ghost"` and `size="icon"`.
- Preserve `onClick`.

**Step 5: Verify build**
Run: `pnpm build`

**Step 6: Commit**
```bash
git add src/components/ToolPicker.tsx
git commit -m "refactor(ui): use Button component in ToolPicker"
```

---

### Task 4: Refactor StackEditorSidebar

**Files:**
- Modify: `src/components/StackEditorSidebar.tsx`

**Step 1: Import Button**
Add `import { Button } from "./ui/button";`

**Step 2: Modify sidebar items (lines 32-47)**
Replace `<button>`.
- Use `variant="ghost"`.
- `className` needs to handle the active state.
- Button usually has padding. The existing code has `px-4 py-2.5`. `Button` has default padding.
- `justify-start` is needed because it's a sidebar item.
- `h-auto` might be needed if the content is tall, or just rely on default height.
- Existing class: `w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors relative ...`
- Button adds base styles. We might need `className={cn("...", className)}` pattern or just pass the full class string if we want to override Button's defaults, but the goal is to *use* Button.
- Strategy: Use `variant="ghost"` and pass `w-full justify-start` and the conditional coloring classes.

**Step 3: Verify build**
Run: `pnpm build`

**Step 4: Commit**
```bash
git add src/components/StackEditorSidebar.tsx
git commit -m "refactor(ui): use Button component in StackEditorSidebar"
```
