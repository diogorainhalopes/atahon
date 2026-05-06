# Atahon — Design System

> **Scope.** This document is the single source of truth for Atahon's visual language: colors, typography, spacing, elevation, motion, and component patterns. It supersedes ad-hoc decisions in `src/theme/*` and `tailwind.config.js` — those files will be brought into compliance during the rollout in §10.

---

## 1. Design Philosophy

Atahon's interface should feel like writing on paper, not tapping a screen. The reference points are e-ink tablets — **reMarkable**, **Boox**, **Kindle Scribe**. The interface gets out of the way of the manga.

**The vibe.** Calm, paper-like, focused, low-stimulation. Reading-app energy, not social-feed energy.

**Foundations.**
- **Greyscale + paper** is the entire palette. The single existing purple (`#7C6EF8`) is the *only* color, used sparingly to mark "this is interactive / active / now."
- **Hierarchy through typography**, not color. A serif display + clean sans body does the work that color usually does in Material apps.
- **Generous whitespace.** A screen that feels under-filled is correct. If something feels tight, add 8dp.
- **Hairline borders** as the default surface treatment. Soft, diffuse shadows are reserved for genuinely elevated surfaces (sheets, modals, FABs) — never on every card.
- **Slow, intentional motion.** Soft cubic easings, no spring bounce in UI transitions. Page-turn feel, not button-mash feel.

**Principles.**
1. **Restraint.** If two elements do the same job, remove one.
2. **Clarity.** Type, spacing, and contrast carry the load before any decoration.
3. **Quiet motion.** Animations should feel like breath, not feedback.
4. **Consistency.** Tokens, not magic numbers. If a value isn't in §2–§5, don't use it.

---

## 2. Color System

All colors are exposed as theme tokens. Components **must not** hardcode hex values — they read from `useTheme()`.

### Light (default — paper)

| Token              | Hex       | Usage                                                                    |
| ------------------ | --------- | ------------------------------------------------------------------------ |
| `background`       | `#FAFAF7` | App background, screen base. Off-white with warm cast — paper, not snow. |
| `surface`          | `#F4F2EC` | Subtle cards, list groupings, sectioned backgrounds.                     |
| `surface-elevated` | `#FFFFFF` | Modals, popovers, bottom sheets — pop *up* from the warm base.           |
| `ink-primary`      | `#1A1A1A` | Headings, primary body, icons. Near-black, not pure black.               |
| `ink-secondary`    | `#5C5C5C` | Secondary text, captions, metadata.                                      |
| `ink-tertiary`     | `#9A9A9A` | Tertiary/disabled text, placeholders, inactive icons.                    |
| `border`           | `#E8E5DD` | Hairline dividers, default card outline (paper-fold gray).               |
| `border-strong`    | `#C9C4B6` | Emphasized dividers (focused input, active card outline).                |
| `accent`           | `#7C6EF8` | The single accent. Active tab dot, primary CTA fill, focus ring.         |
| `accent-soft`      | `#7C6EF814` | 8% wash of accent for highlight backgrounds, selected list rows.       |
| `success`          | `#4CAF7D` | Status text/icon only. Never used as a surface.                          |
| `warning`          | `#C58A1F` | Status text/icon only. Slightly desaturated for paper.                   |
| `error`            | `#C0494B` | Status text/icon only. Slightly desaturated for paper.                   |
| `info`             | `#3F7BBF` | Status text/icon only. Slightly desaturated for paper.                   |

### Dark (warm e-ink dark — "Kindle dark")

| Token              | Hex       | Usage                                                              |
| ------------------ | --------- | ------------------------------------------------------------------ |
| `background`       | `#1F1E1C` | App background. Warm dark gray, **not** black.                     |
| `surface`          | `#26241F` | Cards, list groupings.                                             |
| `surface-elevated` | `#2D2B25` | Modals, popovers, bottom sheets.                                   |
| `ink-primary`      | `#EDEAE3` | Headings, primary body, icons. Off-white, not pure white.          |
| `ink-secondary`    | `#A8A49B` | Secondary text.                                                    |
| `ink-tertiary`     | `#6E6A62` | Tertiary/disabled text.                                            |
| `border`           | `#3A3732` | Hairline dividers.                                                 |
| `border-strong`    | `#55514A` | Emphasized dividers.                                               |
| `accent`           | `#8E82F9` | Slight desaturation/lightening of the canonical purple, for night reading. The token name stays `accent`; the value resolves per theme. |
| `accent-soft`      | `#8E82F924` | ~14% wash of accent.                                             |
| `success`          | `#7AC79B` | Status text/icon only.                                             |
| `warning`          | `#D8A654` | Status text/icon only.                                             |
| `error`            | `#D87679` | Status text/icon only.                                             |
| `info`             | `#7FAFE0` | Status text/icon only.                                             |

> **Reader background** stays `#000000` (light-mode reader still benefits from a true black canvas to maximize image contrast). Reader UI overlay uses dark tokens regardless of app theme.

> **Why the accent shifts in dark mode.** `#7C6EF8` on a `#1F1E1C` background is harsh at night. `#8E82F9` lifts the value just enough to stay readable while keeping the same hue. The canonical accent for branding/light mode remains `#7C6EF8` — the user constraint is preserved.

---

## 3. Typography

**Pairing.** Serif display + clean sans body. Two families, no more.

| Role       | Family                  | Source                                  |
| ---------- | ----------------------- | --------------------------------------- |
| Display    | **Newsreader**          | `@expo-google-fonts/newsreader` (NEW)   |
| Body / UI  | **Geist** (already in)  | `@expo-google-fonts/geist`              |
| Mono       | **Geist Mono**          | `@expo-google-fonts/geist-mono`         |

> Newsreader is chosen over Fraunces/Source Serif because it was designed for on-screen reading at body sizes too — useful if we ever fall back to it for blockquotes or long-form. Fraunces is a fine alternative if we want more personality; Source Serif if we want to stay neutral.

### Type scale

All sizes in dp. Line-height is absolute dp (not a multiplier) for cross-platform predictability. "ls" is letter-spacing in dp.

| Token      | Family     | Weight | Size | Line Height | LS    | Used for                                |
| ---------- | ---------- | ------ | ---- | ----------- | ----- | --------------------------------------- |
| `display`  | Newsreader | 600    | 34   | 40          | -0.6  | Hero/manga title on detail screens      |
| `h1`       | Newsreader | 600    | 26   | 32          | -0.4  | Page title (Library, Browse, …)         |
| `h2`       | Newsreader | 500    | 20   | 26          | -0.2  | Section header inside a screen          |
| `h3`       | Geist      | 600    | 16   | 22          | -0.1  | Card title, list-group label            |
| `body-lg`  | Geist      | 400    | 16   | 26          | 0     | Long-form paragraphs (about, settings)  |
| `body`     | Geist      | 400    | 15   | 24          | 0     | Default body, list rows                 |
| `body-sm`  | Geist      | 400    | 13   | 20          | 0     | Secondary text, captions in dense rows  |
| `caption`  | Geist      | 500    | 12   | 16          | 0.1   | Tab labels, metadata pills              |
| `label`    | Geist      | 600    | 11   | 14          | 1.0   | Uppercase section labels (replaces `commonStyles.sectionLabel`) |

**Reading rhythm.** Body sizes target **1.5–1.6 line-height** (`24/15 = 1.60`, `26/16 = 1.625`). Display tightens to 1.18–1.23 with negative letter-spacing, the way a newspaper masthead does.

### Font loading

Extend the existing `useFonts` call in `app/_layout.tsx`:

```tsx
const [fontsLoaded] = useFonts({
  // existing
  'Geist-Regular':  Geist_400Regular,
  'Geist-Medium':   Geist_500Medium,
  'Geist-SemiBold': Geist_600SemiBold,
  'Geist-Bold':     Geist_700Bold,
  'Geist-Mono':     GeistMono_400Regular,
  // new
  'Newsreader-Medium':   Newsreader_500Medium,
  'Newsreader-SemiBold': Newsreader_600SemiBold,
});
```

Add `@expo-google-fonts/newsreader` to `package.json`.

---

## 4. Spacing & Layout

Single numeric scale, units in dp. Use the named tokens — never `padding: 13`.

| Token   | dp  | Typical use                                          |
| ------- | --- | ---------------------------------------------------- |
| `xs`    | 4   | Icon ↔ label gap, hairline-tight stacks              |
| `sm`    | 8   | Inline gaps, pill padding                            |
| `md`    | 12  | List-row vertical padding                            |
| `lg`    | 16  | Card inner padding, default screen padding (mobile)  |
| `xl`    | 20  | Generous screen padding (replaces today's `spacing[5]`) |
| `2xl`   | 24  | Section vertical rhythm                              |
| `3xl`   | 32  | Block separators                                     |
| `4xl`   | 40  | Page-top breathing room                              |
| `5xl`   | 48  | Hero blocks, empty-state stacks                      |
| `6xl`   | 64  | Large empty states, oversized illustrations          |

**Layout rules.**
- **Default screen padding:** `xl` (20 dp) horizontal, `lg` (16 dp) top, `2xl` (24 dp) between major sections.
- **Vertical rhythm between sections:** `2xl` (24 dp) minimum, `3xl` (32 dp) for screens with breathing room.
- **List row min height:** 56 dp (touch-target safe), padding `md` vertical.
- **Container max-width** (tablet/foldables): 720 dp; center the content with auto margins beyond that.
- **Edge-to-edge media** (manga covers, reader): bypass `xl` padding, render full-bleed.

---

## 5. Elevation & Borders

Most surfaces use a **hairline border**. A few use a **soft, diffuse shadow**. Never both at full strength on the same surface — shadow + hairline border is for Android crispness only (see §5.3).

### 5.1 Elevation scale

| Level      | Border                  | Shadow (iOS)                                                   | Elevation (Android) | Use                                              |
| ---------- | ----------------------- | -------------------------------------------------------------- | ------------------- | ------------------------------------------------ |
| `flat`     | `1px border`            | none                                                           | `0`                 | Default cards, list items, tab bar, inputs       |
| `raised`   | `1px border` (Android)  | `color: #1A1A1A`, `offset: {0,2}`, `opacity: 0.05`, `radius: 12` | `4`                 | Promoted cards, sheets at rest, hover state      |
| `floating` | none                    | `color: #1A1A1A`, `offset: {0,4}`, `opacity: 0.08`, `radius: 18` | `8`                 | FABs, popovers, dropdown menus                   |
| `overlay`  | `1px top-edge` (dark)   | `color: #1A1A1A`, `offset: {0,8}`, `opacity: 0.10`, `radius: 28` | `16`                | Modals, presented bottom sheets                  |

**Shadow color.** Use `#1A1A1A` (the `ink-primary` of light mode), never pure `#000`. Pure black drains warmth out of the paper.

### 5.2 Dark-mode elevation

Shadows on dark backgrounds look muddy. Options, in order of preference:

1. **Top-edge highlight.** `borderTopWidth: 1, borderTopColor: <border>` to suggest light catching the lifted edge. Use for `raised` and `overlay` in dark mode.
2. **Darker shadow at lower opacity.** `shadowColor: '#000'`, `shadowOpacity: 0.35`, larger `shadowRadius`. Use when the surface needs visible separation, e.g. floating popovers over busy art.

`floating` in dark mode keeps a shadow (FABs need to lift); `raised` in dark mode uses the top-edge highlight only.

### 5.3 Combining border + shadow

On Android, soft shadows can leave the edge of a light surface looking blurry. To fix: pair the shadow with a `1px` `border` token on light mode. Skip the border on iOS — the iOS shadow renderer is sharper.

```tsx
const card = {
  backgroundColor: theme.surface,
  borderRadius: theme.radius.lg,
  ...(Platform.OS === 'android'
    ? { borderWidth: 1, borderColor: theme.border, elevation: 4 }
    : { shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12 }),
};
```

### 5.4 Radii

| Token  | dp    | Use                                                |
| ------ | ----- | -------------------------------------------------- |
| `sm`   | 6     | Pills, badges, small chips                         |
| `md`   | 10    | Inputs, buttons, list-row hit areas                |
| `lg`   | 14    | Cards, sectioned groups                            |
| `xl`   | 20    | Modals, bottom sheets, hero containers             |
| `pill` | 9999  | Tab pills, status pills, full-circle FABs          |

### 5.5 Border widths

Always **1 dp** (a single hairline). The visual difference is the *color token*, not the width. Use `border` for default outlines, `border-strong` for focus / emphasis. Never use `2 dp` or thicker borders — they break the paper feel.

---

## 6. Iconography

**Library.** `lucide-react-native` (already installed). Stroke-based, geometric, paper-like.

**Stroke width.** `1.5` everywhere by default. Slightly thinner than Lucide's default `2`, gives a pen-drawn feel. The tab bar may use `1.75` for the active icon to give it presence.

**Sizes.**

| Token | dp | Use                                          |
| ----- | -- | -------------------------------------------- |
| `xs`  | 16 | Inline with `body-sm`/`caption` text         |
| `sm`  | 20 | Default UI icon (header buttons, list rows)  |
| `md`  | 24 | Tab bar, prominent action buttons            |
| `lg`  | 28 | Empty-state and feature icons                |

**Color.** Always `ink-primary` or `ink-secondary`. The accent purple is reserved for **active/selected state only** — e.g. the active tab icon, the checkmark on a selected option. A static toolbar icon is never accent-colored.

---

## 7. Motion & Animation

Soft, slow, intentional. The system below replaces today's bouncy spring (`damping: 15`) defaults. Springs are still allowed for **physical** gestures (pinch-to-zoom, pan) — but UI state transitions (open/close, fade, slide) use timing curves only.

### 7.1 Stack

- **Reanimated 4.2** (already in) — primary tool. Use `withTiming` with our easing tokens.
- **Moti** — *recommended new dependency* for declarative `MotiView` and presence transitions. Adds <30 KB. If we don't take it, fall back to Reanimated layout animations + `Animated.View` directly.
- **Gesture Handler 2.30** — already in.
- **`LayoutAnimation`** — avoid. Imperative, hard to compose, doesn't respect reduce-motion.

### 7.2 Easing

Define one canonical easing and a couple of variants:

```ts
import { Easing } from 'react-native-reanimated';

export const easing = {
  paper:   Easing.bezier(0.25, 0.10, 0.25, 1.00), // settle
  enter:   Easing.bezier(0.20, 0.00, 0.10, 1.00), // decelerate-in
  exit:    Easing.bezier(0.40, 0.00, 1.00, 1.00), // accelerate-out
};
```

**Never** use `Easing.elastic`, `Easing.bounce`, or springs with `damping < 18` for UI transitions.

### 7.3 Durations

| Token    | ms  | Use                                                        |
| -------- | --- | ---------------------------------------------------------- |
| `micro`  | 120 | Press feedback, tiny opacity flips                         |
| `short`  | 200 | Toggle states, dropdown reveal                             |
| `medium` | 320 | Sheet present, modal fade-in, accordion expand             |
| `long`   | 500 | Skeleton swap, pulse half-cycle, content cross-fade        |
| `page`   | 400 | Stack screen transition (page-turn)                        |

### 7.4 Patterns

- **Page transitions.** Replace `slide_from_right` with **fade** (`animation: 'fade'`, `animationDuration: 400`) on the deep stack screens (manga detail, settings). Reader keeps its existing `fade`. Tabs have no transition (instant switch — accepted convention).
- **Press feedback.** Opacity dip to `0.7` over `micro` (120 ms), back to `1.0` over `short` (200 ms). **No** scale bounce. Implement once as a `<PaperPressable>` wrapper (§11).
- **List item entry.** Stagger fade-in: each item starts `opacity: 0, translateY: 8`, animates to `opacity: 1, translateY: 0` over `medium` with `40ms * index` delay (cap at index 8 so big lists aren't slow).
- **Modal / sheet.** Backdrop `opacity: 0 → 0.4` over `medium`. Sheet `translateY: +16 → 0` over `medium` with `easing.enter`. Dismiss reverses with `easing.exit`.
- **Loading.** Use a **gentle pulse** on a placeholder rectangle: `opacity 0.4 ↔ 1.0` over `1600 ms` total, looped. **Never** spin. Skeletons are mandatory wherever an entity has known shape (manga card, list row).
- **Reader gestures.** Pinch-to-zoom keeps springs but raise `damping` from `15` → `20` so the snap-back doesn't oscillate. Pan settle uses `withTiming` + `easing.paper` at `medium`.

### 7.5 Snippets (ship-ready)

Press feedback wrapper (Reanimated only — no extra deps):

```tsx
// src/components/PaperPressable.tsx
import { Pressable, PressableProps } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { easing } from '@theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PaperPressable(props: PressableProps) {
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e) => { opacity.value = withTiming(0.7, { duration: 120, easing: easing.exit }); props.onPressIn?.(e); }}
      onPressOut={(e) => { opacity.value = withTiming(1.0, { duration: 200, easing: easing.enter }); props.onPressOut?.(e); }}
      style={[style, props.style as any]}
    />
  );
}
```

Stack screen transition (in `app/_layout.tsx`):

```tsx
<Stack.Screen
  name="manga/[mangaId]/index"
  options={{ animation: 'fade', animationDuration: 400 }}
/>
```

List stagger entry (Reanimated `entering`):

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';

<Animated.View entering={FadeInDown.duration(320).delay(Math.min(index, 8) * 40)}>
  {/* row */}
</Animated.View>
```

Sheet present (Reanimated):

```tsx
const ty = useSharedValue(16);
const op = useSharedValue(0);
useEffect(() => {
  ty.value = withTiming(0,   { duration: 320, easing: easing.enter });
  op.value = withTiming(0.4, { duration: 320, easing: easing.enter });
}, []);
const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
const back  = useAnimatedStyle(() => ({ opacity: op.value }));
```

---

## 8. Component Patterns

For every component below, the **default** elevation is listed first; alternates apply only to the noted state.

| Component       | Elevation         | Notes |
| --------------- | ----------------- | ----- |
| **Button — primary**   | `flat` → `raised` on press | Filled `accent`, white/`ink-inverse` text, radius `md`. Press = opacity dip + soft `raised` shadow appears. |
| **Button — secondary** | `flat`            | `ink-primary` text, `border` outline, transparent fill. Focus thickens border to `border-strong`. |
| **Button — ghost**     | `flat`            | No border, no fill. Text `ink-primary`, hint of `accent-soft` on press. |
| **Floating CTA**       | `floating` (active) | A "primary action that lifts" — e.g. "Continue reading" on manga detail. |
| **Input**              | `flat`            | Borderless, single `1px` bottom border in `border`. Focus → border becomes `accent`, no shadow. Generous vertical padding (`md`). |
| **Card — default**     | `flat`            | `1px` `border`, radius `lg`, `surface` background, padding `lg`. |
| **Card — promoted**    | `raised`          | Same as default + shadow, used for "featured" content. |
| **List row**           | `flat`            | No border per row. Group separators use a single `1px` `border` divider. Min-height 56dp. |
| **Tab bar**            | `flat`            | At rest: only a `1px` top `border` divider. When content scrolls underneath, optionally a very faint `raised` top-edge shadow. **Active tab indicator** = a 4dp filled `accent` dot under the icon (replaces today's accent tint of the icon — keeps the rest monochrome). |
| **Header (PageHeader)**| `flat`            | At top of scroll: no divider. After scroll > 4dp: `1px` `border` bottom divider fades in. |
| **Modal**              | `overlay`         | Radius `xl` top corners, `surface-elevated` background, `1px` top-edge `border` for crispness on Android, soft diffuse shadow. |
| **Bottom sheet**       | `overlay`         | Same as modal. Drag handle: 36×4 dp, `border-strong`, centered, 8dp top padding. |
| **Toast / snackbar**   | `raised`          | Pill (radius `pill`), `surface-elevated`, `1px` accent `border` for info/success/warning/error variants. Soft shadow lifts it off the content. |
| **FAB**                | `floating`        | Circular (radius `pill`), `accent` background, white icon, soft circular shadow. Reserved for the *single* primary action on a screen. |

**Active state language.**
- A small filled `accent` dot or 2dp bar = "this is the active section."
- Accent fill = "this is the primary action."
- Accent border (1px, on `surface-elevated`) = "this is informational/contextual."
- Greyscale icon = the default. Color is a *signal*, not a decoration.

**Replacing the existing tab bar.** Today's floating pill at `bottom: insets.bottom + 8` stays — but the active icon stops being tinted, replaced by the dot indicator. The pill background becomes `surface-elevated` with `1px border`, dropping its current secondary-bg tint.

---

## 9. Dark Mode

Atahon today is dark-only with no theme switcher. The redesign introduces:

1. A `Theme` type with light + dark variants of every token in §2 and §5.
2. A `ThemeProvider` (React context) that resolves either via:
   - User preference (a `themeMode: 'light' | 'dark' | 'system'` setting in `settingsStore`), defaulting to `system`.
   - `useColorScheme()` from `react-native` when mode is `system`.
3. A `useTheme()` hook returning the resolved token bundle. **All components read tokens from this hook.** Hardcoded hex in components is forbidden (lint rule to follow in rollout).
4. Status bar style derived from the theme: `light` content on dark theme, `dark` on light theme. Background color set per theme.
5. NativeWind className users still work — Tailwind tokens are mapped to CSS variables that flip with the theme (NativeWind v4 supports `darkMode: 'class'` with a class on a root view).

**Reader theming.** The reader's image canvas stays `#000` regardless. The reader *overlay* (top bar, scrubber, sheet) follows the dark-theme tokens always — it's a viewing tool, not part of the app chrome.

---

## 10. Implementation Plan (rollout, phased)

Implement in order. Each phase ships on its own branch. Land foundations before screens.

1. **Tokens & ThemeProvider.** Replace `src/theme/colors.ts` content; add `src/theme/motion.ts`, `src/theme/elevation.ts`. Build `ThemeProvider` + `useTheme`. Mirror the new tokens into `tailwind.config.js` so NativeWind className users get them too. Add `themeMode` to `settingsStore`.
2. **Fonts.** Add `@expo-google-fonts/newsreader`, register weights in `app/_layout.tsx`, expose `Newsreader-Medium` / `Newsreader-SemiBold` in the typography token.
3. **Elevation sweep.** Build `<Card>`, `<Sheet>`, `<Modal>`-base primitives that read elevation tokens. Replace ad-hoc `borderColor`/`shadowColor` usage in `commonStyles.ts` and components with the new primitives.
4. **Typography sweep.** Replace literal `fontSize` / `fontWeight` / `fontFamily` in `commonStyles.ts`, `PageHeader`, `AboutModal`, `LibraryFilterSheet`, `BucketPickerModal`, `DuplicateRepoModal` with the type-scale tokens.
5. **Iconography.** One pass to set `strokeWidth={1.5}` across all `lucide-react-native` usages; bump tab active to `1.75`.
6. **Motion.** Update `app/_layout.tsx` stack transitions to `fade` (page-turn). Build `<PaperPressable>`. Replace `withSpring({damping:15})` in `useReaderGestures.ts` with `withSpring({damping:20})` for pinch and `withTiming` for pan-settle. Add list-stagger to library / browse / chapters.
7. **Foundation components.** Refactor `<Button>`, `<Input>`, `<Card>`, `<ListRow>`, `<Sheet>` against the spec in §8. (Most don't exist as named components today — they're inline. This phase formalizes them.)
8. **Tab bar redesign.** Active dot indicator + monochrome icons.
9. **Screen sweep.** Library → Browse → Updates → History → More → Manga detail → Settings → Extensions/Repos → Downloads. Reader stays last because of its custom overlay.
10. **Lint rule.** Forbid hex literals in `src/` and `app/` outside of `src/theme/`.

---

## 11. Examples & Snippets

### 11.1 Theme object

```ts
// src/theme/theme.ts
import { Platform, ViewStyle } from 'react-native';

const accent = '#7C6EF8'; // canonical — preserved from the original brand

export const lightTheme = {
  mode: 'light' as const,
  background:        '#FAFAF7',
  surface:           '#F4F2EC',
  surfaceElevated:   '#FFFFFF',
  inkPrimary:        '#1A1A1A',
  inkSecondary:      '#5C5C5C',
  inkTertiary:       '#9A9A9A',
  border:            '#E8E5DD',
  borderStrong:      '#C9C4B6',
  accent,
  accentSoft:        '#7C6EF814',
  status: {
    success: '#4CAF7D', warning: '#C58A1F', error: '#C0494B', info: '#3F7BBF',
  },
  shadowColor:       '#1A1A1A',
};

export const darkTheme: typeof lightTheme = {
  mode: 'dark' as const,
  background:        '#1F1E1C',
  surface:           '#26241F',
  surfaceElevated:   '#2D2B25',
  inkPrimary:        '#EDEAE3',
  inkSecondary:      '#A8A49B',
  inkTertiary:       '#6E6A62',
  border:            '#3A3732',
  borderStrong:      '#55514A',
  accent:            '#8E82F9',
  accentSoft:        '#8E82F924',
  status: {
    success: '#7AC79B', warning: '#D8A654', error: '#D87679', info: '#7FAFE0',
  },
  shadowColor:       '#000000',
};

export type Theme = typeof lightTheme;

export const radius = { sm: 6, md: 10, lg: 14, xl: 20, pill: 9999 } as const;
export const space  = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 40, '5xl': 48, '6xl': 64 } as const;

export function elevation(level: 'flat' | 'raised' | 'floating' | 'overlay', t: Theme): ViewStyle {
  if (level === 'flat') {
    return { borderWidth: 1, borderColor: t.border };
  }
  const shared = { borderRadius: radius.lg };
  const map: Record<string, ViewStyle> = {
    raised:   { ...shared, ...Platform.select({
      android: { borderWidth: 1, borderColor: t.border, elevation: 4 },
      ios:     { shadowColor: t.shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12 },
    })! },
    floating: { ...shared, ...Platform.select({
      android: { elevation: 8 },
      ios:     { shadowColor: t.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 18 },
    })! },
    overlay:  { ...shared, ...Platform.select({
      android: { borderTopWidth: 1, borderTopColor: t.border, elevation: 16 },
      ios:     { shadowColor: t.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 28 },
    })! },
  };
  return map[level];
}
```

### 11.2 `useTheme` hook

```ts
// src/theme/ThemeProvider.tsx
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from './theme';
import { useSettingsStore } from '@stores/settingsStore';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode   = useSettingsStore((s) => s.themeMode); // 'light' | 'dark' | 'system'
  const system = useColorScheme();
  const resolved: Theme = useMemo(() => {
    if (mode === 'light') return lightTheme;
    if (mode === 'dark')  return darkTheme;
    return system === 'dark' ? darkTheme : lightTheme;
  }, [mode, system]);
  return <ThemeContext.Provider value={resolved}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
```

### 11.3 `<Button>` against the tokens

```tsx
// src/components/Button.tsx
import { Text, ViewStyle } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';
import { radius, space } from '@theme/theme';
import { PaperPressable } from './PaperPressable';

type Variant = 'primary' | 'secondary' | 'ghost';
export function Button({ label, variant = 'primary', onPress }: { label: string; variant?: Variant; onPress?: () => void }) {
  const t = useTheme();
  const base: ViewStyle = {
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  };
  const styles: Record<Variant, ViewStyle> = {
    primary:   { ...base, backgroundColor: t.accent },
    secondary: { ...base, borderWidth: 1, borderColor: t.border },
    ghost:     { ...base },
  };
  const text = {
    fontFamily: 'Geist-SemiBold',
    fontSize: 15,
    color: variant === 'primary' ? '#FFFFFF' : t.inkPrimary,
  };
  return (
    <PaperPressable onPress={onPress} style={styles[variant]}>
      <Text style={text}>{label}</Text>
    </PaperPressable>
  );
}
```

### 11.4 Page transition config

```tsx
// app/_layout.tsx — replaces today's slide_from_right
<Stack.Screen
  name="manga/[mangaId]/index"
  options={{ animation: 'fade', animationDuration: 400 }}
/>
<Stack.Screen
  name="settings"
  options={{ animation: 'fade', animationDuration: 400 }}
/>
```

### 11.5 `<PaperPressable>` (already shown in §7.5)

Reproduced as the canonical reference; do not reimplement inline. Import from `@components/PaperPressable`.

---

## 12. Do's & Don'ts

**DO**
- Use **paper-warm whites** (`#FAFAF7`) and **near-blacks** (`#1A1A1A`) — never `#FFF` / `#000` for UI surfaces.
- Default to **hairline borders** (1 dp, `border` token) for surfaces.
- Reserve **soft diffuse shadows** for `raised` / `floating` / `overlay` — and pair with a hairline border on Android.
- Use the **serif (Newsreader) for display/h1/h2**, sans (Geist) for everything else.
- Use **slow, soft easings** — `easing.paper`, `easing.enter`, `easing.exit`. Spring damping ≥ 18.
- Be **generous with whitespace** — when in doubt, add 8 dp.
- **Mix flat and raised intentionally** to create hierarchy. Flat = chrome, raised = "lift, look here."
- Pull every color and dimension from `useTheme()` / token constants.

**DON'T**
- Use **pure white** (`#FFFFFF`) or **pure black** (`#000000`) for UI surfaces. (Reader canvas excepted.)
- Apply a **shadow on every card** — most cards are flat. Shadow becomes meaningful when it's rare.
- Use **Material-style hard drop shadows** (`opacity > 0.15`, `radius < 8`).
- Use **bouncy springs** in UI transitions (`damping < 18`, anything `Easing.bounce`/`Easing.elastic`).
- Use **multi-color UI**. Color = active or status, not decoration.
- Use **tight spacing** (anything below 4 dp between elements).
- Use **sans for headings** — display/h1/h2 are always serif.
- Hardcode hex literals in `app/` or `src/components/`.

---

*End of `DESIGN.md`. The accompanying rollout (§10) is tracked separately.*
