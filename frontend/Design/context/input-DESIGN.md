# VULCAN — Design System & Screen Specification

> Input document for OPENDESIGN. Build in this order: **1) tokens → 2) primitives → 3) components → 4) screens** (order listed in §10). Every value is a token — no one-off colors or spacing.

---

## 1. Brand foundation

**Name:** VULCAN — Roman god of fire and the forge.
**Tagline:** *Forged by VULCAN.*
**Concept:** The AI is the blacksmith; the user is the steel. Every workout, meal, and step is a strike of the hammer. The UI is the forge at night: near-black dark, warm ember glow, heat = progress.

**Personality:** Forged · Focused · Relentless · Precise.
**Voice & tone:** A calm, terse coach. Short sentences. No exclamation marks except PR celebrations. Examples:
- Empty history → *"Nothing forged yet. Start your first session."*
- PR → *"New PR. 102.5 kg. The forge remembers."*
- Quota hit → *"The forge cools until tomorrow. 3 scans left at midnight."*

**Logo direction:** Wordmark "VULCAN" in Space Grotesk Bold, tracking tight. Mark: **the Spark** — an eight-pointed molten-orange starburst (elongated cardinal points, shorter diagonals, one solid symmetrical shape) — the instant hammer meets steel. Flat solid points, soft outer glow, must work as a 1024px app icon on flat `#0B0B0D`. No anvil, no hexagon (Minecraft Forge territory — banned). Source file: `logo.png` in project root.

---

## 2. Design principles

1. **Forge atmosphere** — dark everywhere, light only where data lives. The accent *glows*; nothing else does.
2. **Mid-workout speed** — the active session screen is judged by one metric: taps per set. Big targets (≥48px), one-thumb reach, everything else gets out of the way.
3. **Data glows** — charts, rings, and PRs carry the ember. Static chrome stays flat.
4. **Heat = progress** — completion, streaks, PRs, and goal progress are expressed as ignition/fire metaphors. Consistent, never decorative.
5. **Every screen earns its place** — if a screen has one job, it does it full-bleed.

---

## 3. Design tokens (source of truth)

```json
{
  "color": {
    "bg": {
      "base":     "#0B0B0D",
      "elevated": "#141417",
      "card":     "#1B1B20",
      "overlay":  "#232329"
    },
    "border": { "hairline": "#2A2A31", "focus": "#FF6A00" },
    "text": {
      "primary":   "#F5F2EC",
      "secondary": "#A6A29B",
      "muted":     "#6E6A64",
      "onAccent":  "#0B0B0D"
    },
    "accent": {
      "ember300": "#FFB347",
      "ember400": "#FF8A3D",
      "ember500": "#FF6A00",
      "ember700": "#C2410C",
      "glow":     "rgba(255,106,0,0.45)"
    },
    "gradient": {
      "flame": ["#FFB347", "#FF6A00", "#E63E00"],
      "flameAngle": 135,
      "chartFade": ["rgba(255,106,0,0.35)", "rgba(255,106,0,0)"]
    },
    "semantic": {
      "success": "#3ECF8E",
      "warning": "#FFB020",
      "danger":  "#F4502F"
    },
    "macros": { "protein": "#FF6A00", "carbs": "#FFB020", "fat": "#B08CF2" },
    "charts": ["#FF6A00", "#FFB347", "#B08CF2", "#7DD3FC", "#3ECF8E"],
    "steps": "#3ECF8E"
  },
  "font": {
    "display": "Space Grotesk",
    "body": "Inter",
    "numericVariant": "tabular-nums",
    "scale": {
      "display": { "size": 44, "line": 48, "weight": 700, "tracking": "-2%" },
      "title":   { "size": 28, "line": 34, "weight": 700, "tracking": "-1%" },
      "h2":      { "size": 22, "line": 28, "weight": 600 },
      "h3":      { "size": 17, "line": 24, "weight": 600 },
      "body":    { "size": 15, "line": 22, "weight": 400 },
      "label":   { "size": 13, "line": 18, "weight": 500 },
      "caption": { "size": 11, "line": 16, "weight": 500 }
    }
  },
  "spacing": [4, 8, 12, 16, 20, 24, 32, 40, 56],
  "radius": { "xs": 6, "sm": 10, "md": 14, "lg": 20, "xl": 28, "pill": 999 },
  "shadow": {
    "glow":     "0 0 24 rgba(255,106,0,0.35)",
    "glowSoft": "0 0 16 rgba(255,106,0,0.18)",
    "card":     "0 2 12 rgba(0,0,0,0.4)"
  },
  "motion": {
    "spring": { "damping": 20, "stiffness": 200 },
    "ringFill": { "duration": 800, "easing": "easeOut" },
    "ignite": { "duration": 350, "easing": "easeOut" },
    "sheet": { "duration": 280, "easing": "easeOut" }
  }
}
```

---

## 4. Typography rules

- **Display/numerals:** Space Grotesk, always tabular figures. Used for: screen titles, big numbers (weights, kcal, ring centers), timers.
- **Everything else:** Inter.
- Big stat numerals are **display size in Space Grotesk Bold** with the unit in caption/muted beside it (`102.5` **kg**).
- Never more than 2 weights on one screen.

## 5. Iconography

- Lucide-style outlined icons, 1.5px stroke, rounded caps, 24px default in 48px touch targets.
- Custom icons needed: `ember` (streak), `anvil` (brand), `spark` (PR), `plate` (weight).
- No filled icons except the center Train tab (filled ember).

## 6. Component library

**Buttons**
- `Primary` — pill, flame gradient fill, glow shadow, text/onAccent. Pressed: gradient darkens 10%, glow softens. Height 52.
- `Secondary` — pill, bg/card + hairline border, text/primary.
- `Ghost` — transparent, text/secondary.
- `Destructive` — ghost with danger text.

**Inputs** — `TextField` (bg/elevated, radius sm, 1px hairline; focus = ember border + glowSoft), `Stepper` (− value +, 44px buttons), `Slider` (thin track, ember fill, round thumb with glow), `SegmentedControl` (bg/elevated pill container, active = ember500 text on overlay), `Chip` (selectable: idle hairline, selected ember border + ember text).

**Data display**
- `Card` — bg/card, radius lg, hairline, card shadow. 16px padding.
- `StatTile` — Card + caption label + Space Grotesk numeral + optional mini sparkline.
- `RingProgress` — the hero. Rounded caps, 10px track (bg/overlay), molten gradient fill, glow on the leading cap, fill animates 800ms. Center content slot.
- `MacroBar` — horizontal stacked bar (protein/carbs/fat colors), radius pill, 8px tall, legend below in caption.
- `PRBadge` — spark icon + "PR" in ember500, glowSoft.
- `StreakFlame` — ember icon + count; lit = gradient, unlit = muted.
- `QuotaMeter` — thin progress bar + caption ("2 of 5 scans left").
- `ConfidenceChip` — AI confidence: high=success, medium=warning, low=danger; always paired with "AI estimate" label.

**Workout-specific**
- `SetRow` — 48px row: [set #] [prev "60×8"] [kg field] [reps field] [RPE field] [check circle]. Idle: bg transparent. **Completed: row ignites** — bg washes ember500/10%, check circle fills flame gradient + glow, haptic tap, 350ms. Swipe left → set-type menu (warmup / drop / failure / delete). Supersets share a colored left spine (charts palette, per group).
- `ExerciseCard` (session) — Card with exercise name, note icon, ⋮ menu, contained SetRows, "Add set" ghost button.
- `RestTimerBar` — floating bottom bar: circular countdown (Space Grotesk), progress ring, +30s and skip buttons. Pulses glowSoft when under 10s. Fires local notification at 0.

**Content cards**
- `WorkoutCard` — routine name, exercise count, last performed, muscle chips.
- `MealCard` — thumbnail (or ember placeholder), name, kcal numeral, macro caption.
- `CoachNoteCard` — elevated card, left ember spine, spark icon, AI text, caption "VULCAN coach".

**Overlays**
- `BottomSheet` — bg/elevated, radius xl top, drag handle, dim backdrop 60%.
- `Toast` — top, bg/overlay, hairline, icon; success/PR variants use ember.
- `Skeleton` — bg/card blocks with ember shimmer sweep (subtle, 1200ms).
- `EmptyState` — centered dim ember illustration + h3 + caption + optional primary CTA.

**Charts** (victory-native / gifted-charts)
- Area (weight trend): ember line + chartFade gradient under, hairline grid, no y-axis labels right.
- Bars (weekly volume): ember500, radius xs tops.
- Line (e1RM): ember line, glow dot on last point.
- All charts: no legends on mobile — use chips above.

## 7. Navigation

Bottom tab bar, 5 tabs, bg/base + top hairline. **Center tab is "Train"**: raised 56px circle, filled flame gradient, glow, anvil/ember icon — visible from every screen (one-thumb mid-gym access).

| Tab | Icon | Route |
|---|---|---|
| Today | flame-outline | `/(tabs)/today` |
| Nutrition | apple-outline | `/(tabs)/nutrition` |
| **Train** | **anvil (filled ember circle)** | `/(tabs)/train` |
| Progress | chart-line | `/(tabs)/progress` |
| Profile | person-outline | `/(tabs)/profile` |

Modal/stack routes: `/workout/session`, `/workout/[id]`, `/exercise/[id]`, `/routine/[id]`, `/routine/builder`, `/nutrition/add`, `/nutrition/scan`, `/nutrition/confirm`, `/progress/checkin`, `/progress/compare`, `/program/generate`, `/program/review`, `/settings/*`, `/(auth)/*`, `/(onboarding)/*`.

---

## 8. Screen specifications

### Auth & onboarding

**S1 · Splash** — bg/base. Center: ember dot ignites (scale+glow spring), resolves into VULCAN wordmark. <1.2s. No text besides wordmark.

**S2 · Welcome (auth)** — Full-bleed ember glow from bottom. Wordmark top-third. H1: *"Forge your physique."* Caption: *"AI coaching. Training. Nutrition. One forge."* Primary: "Continue with Google". Secondary: "Continue with email". Terms caption.

**S3 · Login / S4 · Signup** — Title, email + password TextFields, primary button, forgot-password ghost (login), inline error states (danger border + caption), keyboard-avoiding.

**S5 · Onboarding wizard** — 13 steps, top progress bar (ember fill), back ghost, one question per screen, big selectable cards/chips, primary "Continue" disabled until valid:
1. Welcome — "Answer a few questions. The forge does the rest."
2. Name (TextField)
3. Sex (2 cards)
4. Birthdate (wheel picker)
5. Height (Stepper/slider, unit toggle cm/ft)
6. Weight (same, kg/lb)
7. Goal — 4 cards: Cut / Recomp / Maintain / Bulk (icon + one-line description)
8. Pace — slider, weekly rate (cut: −0.25…−1.0 kg/wk; bulk: +0.1…+0.5), live kcal delta preview
9. Experience — 3 cards (Beginner <1y / Intermediate 1–3y / Advanced 3y+)
10. Schedule — days/week stepper + session length chips (45/60/90 min)
11. Equipment — multi-select chips (full gym, dumbbells, barbell+rack, machines, bands, bodyweight)
12. Injuries/limitations — chips (lower back, shoulder, knee, wrist) + optional text
13. **Reveal** — forge-seal animation → computed daily targets (kcal numeral + macro split + protein) → primary "Enter the forge". Data saved; lands on Today.

### Today (dashboard)

**S6 · Today** — Scroll, bg/base, 16px gutters:
- Header: "Today, <name>" (title) + date caption + StreakFlame right.
- Hero Card: large RingProgress (calories consumed / target) with center numeral (remaining kcal), MacroBar beneath (protein/carbs/fat progress).
- Row of 2 StatTiles: Steps (count + mini 7-day bars, steps color) · Weight (latest + trend arrow, taps to log modal).
- WorkoutCard: today's scheduled session (from active program) — "Start" primary; or "Rest day — the forge cools" state.
- CoachNoteCard: latest AI note (from program rationale / physique focus).
- States: loading skeletons; offline → top hairline banner "Offline — changes sync later".

### Train

**S7 · Train home** — Title "Train". Active program banner Card (program name, week x/y, source badge "AI"). Section "My routines": WorkoutCards + "New routine" ghost. Section "History": last 5 sessions (name, date, volume, duration) → see all. Primary persistent: "Start empty workout".

**S8 · Routine detail** — Day label, exercise list (name, target sets×reps, muscle chip), edit (reorder drag handles, remove), "Start workout" primary. AI routines show rationale CoachNoteCard.

**S9 · Routine builder** — Name field, exercise list, "Add exercise" → S12 picker, per-exercise target sets/reps/RPE + superset grouping toggle + rest seconds, save.

**S10 · Active workout session** — *The most important screen in the app.*
- Top bar: elapsed timer (Space Grotesk), "Finish" primary-text button.
- Scroll of ExerciseCards (§6 SetRow spec). Keyboard: numeric, prev-values ghost text ("60 × 8") for one-tap repeat.
- Completed sets ignite; completing the last set of an exercise flashes a subtle "done" check on the card header.
- RestTimerBar floats above bottom edge after each completed set (auto-start from exercise rest_seconds, default 120s).
- "+ Add exercise" (S12 sheet) at bottom.
- Finish → confirmation sheet → **S11**. Discard ghost in top bar with confirm.
- Screen stays awake; all state persisted locally on every keystroke (offline-proof).

**S11 · Workout summary** — Ember burst animation on open. Stats row: duration, total volume, sets. PR list with PRBadges ("Bench Press — 102.5 kg × 5 e1RM 118"). Notes field. "Done" → Train home.

**S12 · Exercise picker (sheet)** — Search field, muscle-group chip filter row, equipment filter, alphabetical list (name + primary muscle caption + equipment caption), "Create custom exercise" at top (name, muscle, equipment → saved). Multi-select mode when adding to session.

**S13 · Exercise detail** — Name, muscle chips, instructions, charts: e1RM line + per-session volume bars (chips switch), PR history list, all sets history (date, top set).

**S14 · History** — Month-grouped list of sessions (name, date, duration, volume, PR sparks). Taps → S15.

**S15 · Past workout detail** — Read-only session: exercise cards with completed sets table, summary header. "Repeat as new workout" ghost.

### Nutrition

**S16 · Nutrition diary** — Date strip (7-day horizontal). Calorie RingProgress (compact) + MacroBar. Meal sections (Breakfast/Lunch/Dinner/Snacks chips or time-grouped): MealCards, swipe → delete. FAB "+" → S17.

**S17 · Add meal sheet** — 3 big options: **"Scan food"** (primary, camera icon) · "Quick add" (manual kcal+macros fields) · "Search" (v1: recent meals list to re-log).

**S18 · Food scan camera** — Full-bleed camera, ember frame guides, shutter button, gallery picker bottom-left, tips caption ("Flat lay, whole plate visible").

**S19 · AI food confirm** — *Mandatory review before logging.* Photo top (16:9 crop). Editable name TextField. Serving stepper. 4 editable StatTiles: kcal, protein, carbs, fat. ConfidenceChip + caption "AI estimate — adjust before logging". Primary "Log meal" → diary; ghost "Retake". Quota meter ("2 of 5 scans left") in caption.

**S20 · Meal detail** — Photo, macros breakdown, logged time, edit fields, delete.

### Progress

**S21 · Progress home** — Sections:
- Weight: area chart (30/90/all chips) + "Log weight" ghost → modal Stepper.
- Strength: lift selector chips (auto: top 4 by volume) + e1RM line chart.
- Volume: weekly bars.
- Physique: photo check-in CTA card ("Monthly check-in") + latest analysis summary card.
- PR wall: grid of PRBadges (exercise + value + date).

**S22 · Photo check-in** — Guided capture: 3 frames (front/side/back, optional 1–3), pose outline overlays, privacy caption ("Photos stay private on your account"), primary "Analyze with VULCAN" (shows quota), skip ghost.

**S23 · Photo compare** — Drag slider between two dates (PhotoCompareSlider), date labels, download ghost.

**S24 · Physique analysis** — CoachNoteCard-style scroll: summary, "Strong areas" chips (success), "Focus areas" chips (ember), posture notes, recommendations list, disclaimer caption. CTA: "Apply focus to next program". Refusal state: friendly card with retake tips (lighting, framing).

### AI program

**S25 · Program generate** — Intro card ("VULCAN builds your program from your training data"), current goal snapshot, optional focus text field, quota meter, primary "Forge my program". **Generating state:** full-screen forge animation — ember particles, hammer-strike pulses, cycling status lines ("Reading your history…", "Balancing volume…", "Tempering the split…"). 3–15s.

**S26 · Program review** — Program name (editable), week tabs, day cards (exercise rows: name, sets×reps, RPE, rest), CoachNoteCard with rationale ("Why this split"). Primary "Apply program" (archives previous active), ghost "Regenerate" (quota-gated, confirm sheet).

### Profile & settings

**S27 · Profile** — Avatar/initial, name, goal chip. Rows: Edit profile · Goals & targets · Units · Equipment · AI usage · Privacy & data · About · Sign out (destructive).

**S28 · Goals & targets** — Current goal card, computed targets (kcal + macros), "Recalculate" (re-runs engine from latest weight), change goal → confirmation.

**S29 · AI usage** — QuotaMeters per feature (food scans today, program this week, physique this week), reset times, caption explaining limits.

**S30 · Privacy & data** — Export data (ghost), Delete account (destructive, double-confirm), privacy policy link, disclaimer text.

---

## 9. Global states

- **Loading:** ember shimmer skeletons matching layout.
- **Error:** inline caption under component, or Toast; never block the whole screen unless fatal.
- **Offline:** hairline top banner on Today + session; queued mutations sync silently.
- **Quota exceeded:** BottomSheet — ember icon, "The forge cools" copy, reset time, OK.
- **AI failure/refusal:** Toast + component-level fallback card with retry ghost.

## 10. Build order for OPENDESIGN

1. Design tokens (§3) + typography + icon set
2. Primitives: buttons, inputs, chips, cards
3. Data components: RingProgress, MacroBar, StatTile, charts, skeletons
4. Workout components: SetRow, ExerciseCard, RestTimerBar (with ignite states)
5. Screens in this order: S1 → S5 (onboarding) → S6 (Today) → S7/S10/S11 (Train core) → S16–S19 (Nutrition + confirm) → S21–S24 (Progress) → S25/S26 (Program) → S27–S30 (Profile) → remaining (S8/S9/S12–S15/S20)
6. Global states & empty states last

## 11. Accessibility & motion rules

- All touch targets ≥44px (SetRow 48px). Contrast ≥ WCAG AA on dark (text/primary and text/secondary pass on all bg tokens).
- Haptics: light tap on set complete, medium on PR, none elsewhere by default.
- Respect reduce-motion: disable ember particles/glow pulses, keep simple fades.
- Every AI-generated surface carries an "AI estimate / guidance" caption.