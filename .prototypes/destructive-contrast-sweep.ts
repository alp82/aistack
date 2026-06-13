/**
 * WCAG AA contrast audit for --destructive token
 *
 * Correct OKLCH → linear sRGB → relative luminance pipeline.
 * No external dependencies — matrices implemented directly.
 *
 * Token values pulled VERBATIM from src/styles.css (dark theme, :root block):
 *   --destructive:            oklch(0.63 0.2 26)
 *   --destructive-foreground: oklch(0.97 0.01 26)
 *   --background:             var(--bg-canvas)  = oklch(0.16 0.008 256)
 *   --card:                   var(--bg-panel)   = oklch(0.20 0.009 256)
 *   --popover:                var(--bg-panel-elevated) = oklch(0.28 0.01 256)
 *   --bg-panel-muted:         oklch(0.24 0.009 256)
 *
 * Two constraints evaluated across a lightness sweep of --destructive:
 *   A) destructive-foreground ON bg-destructive  → WCAG AA small text ≥ 4.5:1
 *   B) text-destructive (fg = destructive token) ON each dark surface → ≥ 4.5:1
 *      (icons / large decorative → ≥ 3:1 acceptable, noted separately)
 *
 * Sanity check: sRGB(1,0,0) ≈ luminance 0.2126 (standard red).
 */

// ---------------------------------------------------------------------------
// OKLCH → OKLab → linear sRGB → luminance
// ---------------------------------------------------------------------------

function oklchToOklab(L: number, C: number, h: number): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  return [L, C * Math.cos(hRad), C * Math.sin(hRad)];
}

function oklabToLinearSRGB(L: number, a: number, b: number): [number, number, number] {
  // OKLab → LMS (cube of the OKLab intermediate space)
  // M1 inverse (Björn Ottosson, 2020)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // M2 inverse: LMS → linear sRGB
  const r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return [r, g, bl];
}

function linearToSRGB(c: number): number {
  // Clamp to avoid negative/NaN from gamut edge colors
  c = Math.max(0, Math.min(1, c));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function oklchToLuminance(L: number, C: number, h: number): number {
  const [la, a, b] = oklchToOklab(L, C, h);
  const [r, g, bl] = oklabToLinearSRGB(la, a, b);
  // Relative luminance uses LINEAR sRGB (before gamma)
  const rLin = Math.max(0, r);
  const gLin = Math.max(0, g);
  const bLin = Math.max(0, bl);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

function contrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker  = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function fmt(n: number, dec = 4): string {
  return n.toFixed(dec);
}

// ---------------------------------------------------------------------------
// Sanity check: sRGB(1,0,0) should have luminance ≈ 0.2126
// Pure red in linear sRGB = (1, 0, 0). We verify by converting a known
// oklch representation of sRGB red ≈ oklch(0.6279 0.2577 29.23).
// ---------------------------------------------------------------------------

console.log("=== SANITY CHECK ===");
// Known: sRGB #FF0000 ≈ oklch(0.6279554 0.25768 29.234)
const redLum = oklchToLuminance(0.6279554, 0.25768, 29.234);
console.log(`oklch(0.6279554 0.25768 29.234) luminance = ${fmt(redLum)} (expected ≈ 0.2126)`);
// Also check white: oklch(1 0 0)
const whiteLum = oklchToLuminance(1, 0, 0);
console.log(`oklch(1 0 0) luminance = ${fmt(whiteLum)} (expected ≈ 1.0)`);
// Black: oklch(0 0 0)
const blackLum = oklchToLuminance(0, 0, 0);
console.log(`oklch(0 0 0) luminance = ${fmt(blackLum)} (expected ≈ 0.0)`);
// White-on-black contrast should be 21:1
console.log(`White/Black contrast = ${fmt(contrastRatio(whiteLum, blackLum), 2)}:1 (expected 21:1)`);
console.log();

// ---------------------------------------------------------------------------
// Token values from src/styles.css
// ---------------------------------------------------------------------------

const TOKENS = {
  destructiveFg:  { L: 0.97, C: 0.01, h: 26  },  // --destructive-foreground
  bgCanvas:       { L: 0.16, C: 0.008, h: 256 },  // --background (bg-canvas)
  bgPanel:        { L: 0.20, C: 0.009, h: 256 },  // --card (bg-panel)
  bgPanelMuted:   { L: 0.24, C: 0.009, h: 256 },  // --bg-panel-muted (muted/secondary)
  bgPanelElevated:{ L: 0.28, C: 0.01,  h: 256 },  // --popover (bg-panel-elevated)
  bgShell:        { L: 0.12, C: 0.01,  h: 256 },  // --bg-shell (darkest surface)
  bgSectionDark:  { L: 0.18, C: 0.008, h: 256 },  // --bg-section-dark
};

const surfaces = [
  { name: "bg-canvas (--background)", ...TOKENS.bgCanvas },
  { name: "bg-shell (darkest)",       ...TOKENS.bgShell },
  { name: "bg-panel (--card)",        ...TOKENS.bgPanel },
  { name: "bg-panel-muted",           ...TOKENS.bgPanelMuted },
  { name: "bg-panel-elevated (--popover)", ...TOKENS.bgPanelElevated },
  { name: "bg-section-dark",          ...TOKENS.bgSectionDark },
];

// Pre-compute surface luminances
const surfaceLums = surfaces.map(s => ({
  ...s,
  lum: oklchToLuminance(s.L, s.C, s.h),
}));

const fgLum = oklchToLuminance(
  TOKENS.destructiveFg.L,
  TOKENS.destructiveFg.C,
  TOKENS.destructiveFg.h,
);

// ---------------------------------------------------------------------------
// Current values audit
// ---------------------------------------------------------------------------

console.log("=== CURRENT TOKEN AUDIT ===");
console.log(`--destructive:             oklch(0.63 0.2 26)`);
console.log(`--destructive-foreground:  oklch(0.97 0.01 26)`);
console.log();

const currentDestructiveLum = oklchToLuminance(0.63, 0.2, 26);
const currentFgLum = fgLum; // destructive-foreground
const currentButtonContrast = contrastRatio(currentFgLum, currentDestructiveLum);

console.log(`Luminance of --destructive (0.63 0.2 26): ${fmt(currentDestructiveLum)}`);
console.log(`Luminance of --destructive-foreground (0.97 0.01 26): ${fmt(currentFgLum)}`);
console.log(`CONSTRAINT A — destructive-fg ON bg-destructive: ${fmt(currentButtonContrast, 2)}:1  ${currentButtonContrast >= 4.5 ? "✓ PASS" : "✗ FAIL (<4.5)"}`);
console.log();
console.log("CONSTRAINT B — text-destructive (red) ON dark surfaces:");
for (const s of surfaceLums) {
  const cr = contrastRatio(currentDestructiveLum, s.lum);
  const textPass  = cr >= 4.5;
  const largePass = cr >= 3.0;
  console.log(`  ${s.name.padEnd(42)} lum=${fmt(s.lum)}  contrast=${fmt(cr,2)}:1  ${textPass ? "✓ AA text" : largePass ? "~ AA large/icon only" : "✗ FAIL"}`);
}

// ---------------------------------------------------------------------------
// Sweep: L from 0.40 to 0.65, step 0.01, fixed C=0.2 h=26
// For each L candidate:
//   - constraintA: destructive-fg ON bg-destructive
//   - constraintB: bg-destructive (text-destructive) ON each surface
// ---------------------------------------------------------------------------

console.log();
console.log("=== SWEEP: L from 0.40 to 0.65, C=0.2 h=26 ===");
console.log("(Holding chroma/hue from actual --destructive token)");
console.log();

// Table header
const headerSurfaces = surfaceLums.map(s => s.name.replace(/\(.*\)/, "").trim().substring(0,16).padEnd(16));
console.log(
  "L     | lum_dest | A:fg/dest | " +
  surfaceLums.map((s, i) => `B${i+1}:${s.name.substring(0,10).padEnd(12)}`).join(" | ")
);
console.log("-".repeat(130));

type SweepRow = {
  L: number;
  lum: number;
  contrastA: number;
  passA: boolean;
  bContrasts: number[];
  allBTextPass: boolean;
  allBLargePass: boolean;
};

const rows: SweepRow[] = [];

for (let Lval = 0.40; Lval <= 0.651; Lval += 0.01) {
  const L = Math.round(Lval * 100) / 100;
  const lum = oklchToLuminance(L, 0.2, 26);
  const contrastA = contrastRatio(fgLum, lum);
  const passA = contrastA >= 4.5;

  const bContrasts = surfaceLums.map(s => contrastRatio(lum, s.lum));
  const allBTextPass  = bContrasts.every(cr => cr >= 4.5);
  const allBLargePass = bContrasts.every(cr => cr >= 3.0);

  rows.push({ L, lum, contrastA, passA, bContrasts, allBTextPass, allBLargePass });

  const flag = passA && allBTextPass ? " <-- BOTH PASS"
             : passA && allBLargePass ? " <-- A pass + B large"
             : passA ? " <-- A pass only"
             : allBTextPass ? " <-- B pass only"
             : "";

  console.log(
    `${fmt(L,2).padEnd(5)} | ${fmt(lum).padEnd(8)} | ${fmt(contrastA,2).padEnd(9)} | ` +
    bContrasts.map(cr => fmt(cr,2).padEnd(16)).join(" | ") + flag
  );
}

// ---------------------------------------------------------------------------
// Recommendation
// ---------------------------------------------------------------------------

console.log();
console.log("=== RECOMMENDATION ===");

// Find rows where A passes (fg-on-button ≥ 4.5)
const aPassRows = rows.filter(r => r.passA);
// Among those, find ones where ALL B surfaces also pass at text level (≥ 4.5)
const bothPassRows = aPassRows.filter(r => r.allBTextPass);

if (bothPassRows.length > 0) {
  // Prefer the highest L that still passes A (least visible change from current 0.63)
  const bestSingle = bothPassRows.reduce((prev, cur) => cur.L > prev.L ? cur : prev);
  console.log(`VERDICT: A single shared --destructive token CAN satisfy both constraints.`);
  console.log(`Highest-L (closest to current 0.63) that passes both A and B (text):`);
  console.log(`  L = ${fmt(bestSingle.L,2)}  →  oklch(${fmt(bestSingle.L,2)} 0.2 26)`);
  console.log(`  Constraint A (fg/button):  ${fmt(bestSingle.contrastA,2)}:1  [need ≥4.5]`);
  console.log(`  Constraint B contrasts on surfaces:`);
  for (let i = 0; i < surfaceLums.length; i++) {
    const cr = bestSingle.bContrasts[i];
    console.log(`    ${surfaceLums[i].name.padEnd(42)} ${fmt(cr,2)}:1  ${cr >= 4.5 ? "✓" : "~"}`);
  }

  // Also find the lowest-L that passes A (darkest that keeps fg readable)
  const lowestA = aPassRows[0];
  const highestA = aPassRows[aPassRows.length - 1];
  console.log();
  console.log(`Range of L values that pass constraint A (button):  ${fmt(lowestA.L,2)} – ${fmt(highestA.L,2)}`);

} else {
  // Single token can't satisfy both — find split recommendation
  console.log("VERDICT: A SINGLE token CANNOT satisfy both constraints simultaneously.");
  console.log();

  // Best for button (A): lowest L that passes A with safety margin
  const bestButton = aPassRows.find(r => r.contrastA >= 4.7);
  console.log("SPLIT RECOMMENDATION:");
  if (bestButton) {
    console.log(`  --destructive-fill (bg-destructive button): oklch(${fmt(bestButton.L,2)} 0.2 26)`);
    console.log(`    → Constraint A: ${fmt(bestButton.contrastA,2)}:1  ✓`);
  }

  // Best for red-on-dark text (B): find the L range that satisfies B on canvas (hardest surface)
  const canvasIdx = surfaceLums.findIndex(s => s.name.includes("canvas"));
  const bPassForCanvas = rows.filter(r => r.bContrasts[canvasIdx >= 0 ? canvasIdx : 0] >= 4.5);
  if (bPassForCanvas.length > 0) {
    const bestAccent = bPassForCanvas.reduce((prev, cur) => cur.L > prev.L ? cur : prev);
    console.log(`  --destructive (text-destructive accent):    oklch(${fmt(bestAccent.L,2)} 0.2 26)`);
    console.log(`    → Constraint B on canvas: ${fmt(bestAccent.bContrasts[canvasIdx >= 0 ? canvasIdx : 0],2)}:1  ✓`);
    console.log(`    → NOTE: This is the current value if it already passes B`);
  }

  // Show current status per constraint
  console.log();
  console.log("Current 0.63 status:");
  const cur = rows.find(r => r.L === 0.63);
  if (cur) {
    console.log(`  A (button): ${fmt(cur.contrastA,2)}:1 ${cur.passA ? "✓" : "✗"}`);
    for (let i = 0; i < surfaceLums.length; i++) {
      const cr = cur.bContrasts[i];
      console.log(`  B${i+1} ${surfaceLums[i].name.padEnd(42)} ${fmt(cr,2)}:1 ${cr >= 4.5 ? "✓" : cr >= 3.0 ? "~large" : "✗"}`);
    }
  }
}

// ---------------------------------------------------------------------------
// AdminReviewTab uses text-white ON bg-destructive — check that too
// ---------------------------------------------------------------------------

console.log();
console.log("=== BONUS: AdminReviewTab uses text-white (not destructive-fg) on bg-destructive ===");
console.log("(src/components/admin/AdminReviewTab.tsx uses hardcoded text-white)");
// white = oklch(1 0 0)
const whiteLum2 = oklchToLuminance(1, 0, 0);
const currentAdminContrast = contrastRatio(whiteLum2, currentDestructiveLum);
console.log(`text-white on current destructive (0.63): ${fmt(currentAdminContrast,2)}:1  ${currentAdminContrast >= 4.5 ? "✓" : "✗"}`);

// Sweep for admin button too
for (const r of rows) {
  const cr = contrastRatio(whiteLum2, r.lum);
  if (r.L >= 0.44 && r.L <= 0.56) {
    console.log(`  L=${fmt(r.L,2)}  white-on-destructive: ${fmt(cr,2)}:1  ${cr >= 4.5 ? "✓" : "✗"}`);
  }
}
