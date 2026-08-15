# Typography System Update — Esports Font Preview

## Overview
Replaced the congested monospace-heavy typography with a flexible system that allows testing multiple esports-suitable fonts. The current site fonts (Bebas Neue + Space Mono) felt cramped and unprofessional for an esports platform.

## Changes Made

### 1. Google Fonts Import (`src/app/globals.css`)
Added three candidate fonts via Google Fonts:
- **Rajdhani** (400/500/600/700) — Angular, esports-standard, excellent legibility at small sizes
- **Chakra Petch** (400/500/600/700) — Technical/HUD feel, slightly wider than Rajdhani
- **Exo 2** (400/500/600/700/800) — Geometric with technical edge, versatile for display and body

### 2. CSS Variable System
Created font preview modes using CSS variables:
```css
html.font-preview-rajdhani { --font-display: var(--font-rajdhani); --font-mono: var(--font-rajdhani); }
html.font-preview-chakra { --font-display: var(--font-chakra); --font-mono: var(--font-chakra); }
html.font-preview-exo2 { --font-display: var(--font-exo2); --font-mono: var(--font-exo2); }
```

### 3. Improved Spacing & Readability
- Increased `letter-spacing` on headings from `-0.02em` to `0.02em`
- Increased `line-height` on body text to `1.6` (from default ~1.5)
- Added `letter-spacing: 0.01em` to body copy for better readability
- Improved `.fn-label` spacing: `letter-spacing: 0.12em`, `line-height: 1.5`
- Body paragraphs and small text: `line-height: 1.65`, `letter-spacing: 0.015em`

### 4. Font Preview Toggle Component (`src/components/common/FontPreviewToggle.tsx`)
A floating UI component that allows switching between fonts in real-time:
- Accessible via floating button (bottom-right corner)
- Persists selection via localStorage
- Shows active state and font descriptions
- Works across all pages site-wide

### 5. Layout Integration (`src/app/layout.tsx`)
- Added FontPreviewToggle component to root layout
- Updated hydration script to read `fn-font-preview` from localStorage
- Applies preview class to `<html>` element on load

## How to Test

### Method 1: UI Toggle (Recommended)
1. Navigate to any page (Home, Athletes, Teams)
2. Click the "Preview Fonts" button in the bottom-right corner
3. Select Rajdhani, Chakra Petch, or Exo 2
4. Browse the site to see how each font performs in different contexts

### Method 2: Browser Console
```javascript
// Set Rajdhani
localStorage.setItem('fn-font-preview', 'rajdhani');
location.reload();

// Set Chakra Petch
localStorage.setItem('fn-font-preview', 'chakra');
location.reload();

// Set Exo 2
localStorage.setItem('fn-font-preview', 'exo2');
location.reload();

// Reset to default
localStorage.removeItem('fn-font-preview');
location.reload();
```

### Method 3: Direct URL Modification
Modify the hydration script in `layout.tsx` to check query params (advanced).

## Pages to Review

### Home Page (`/`)
- Hero section headlines and stat counters
- Featured athletes cards
- Wager preview cards
- Section titles and labels

### Athletes Page (`/athletes`)
- Player card templates
- Stat bars and ratings
- Sidebar roster list
- Detail panel typography

### Teams/Power Rankings Page (`/teams`)
- Team header displays
- Power ranking numbers
- Roster cards
- Achievement lists

## Font Characteristics

| Font | Best For | Personality | Weights Available |
|------|----------|-------------|-------------------|
| **Rajdhani** | All-around esports UI | Angular, modern, clean | 400/500/600/700 |
| **Chakra Petch** | HUD-style interfaces | Technical, squared-off, tactical | 400/500/600/700 |
| **Exo 2** | Versatile branding | Geometric, professional, futuristic | 400/500/600/700/800 |
| **Current (Default)** | Original design | Condensed display + monospace body | Varies |

## Recommendation Criteria

When evaluating fonts, consider:
1. **Legibility at small sizes** — Labels, stats, card descriptions
2. **Display impact** — Headlines, hero sections, large metrics
3. **Technical feel** — Does it read as "competitive gaming" without being gimmicky?
4. **Weight variety** — Enough weights for hierarchy (body, labels, headings, display)
5. **Letter spacing** — Does it feel open and confident, not cramped?

## Next Steps After Selection

Once you've picked the winner:

1. Update `globals.css` to use the selected font as default:
```css
:root {
  --font-display: 'Rajdhani', sans-serif; /* or chosen font */
  --font-mono: 'Rajdhani', sans-serif;    /* or keep separate for stats */
}
```

2. Remove unused font imports and preview classes

3. Optionally keep monospace (`Space Mono`) strictly for numeric stat readouts if desired

4. Remove the FontPreviewToggle component from production build

## Files Modified

- `src/app/globals.css` — Font imports, CSS variables, spacing improvements
- `src/app/layout.tsx` — FontPreviewToggle integration
- `src/components/common/FontPreviewToggle.tsx` — New component (created)

## Notes

- All color tokens, layout, and card treatments remain untouched
- Font preview persists across page reloads via localStorage
- No breaking changes — original fonts remain as fallback
- TypeScript compilation passes with no errors
