# Button CSS demo library

Copy a **Primary** block into **Theme → Custom button CSS → Primary button CSS** and the matching **Secondary** block into the Secondary editor.

These are original demo styles inspired by common patterns in real product categories. They are not copied from any specific company.

## Supported syntax

The editors accept standard CSS declarations, custom properties, and these state blocks:

```css
background: #111827;
color: #ffffff;
border-radius: 10px;

:hover {
  background: #030712;
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(59, 130, 246, .35);
  outline-offset: 2px;
}
```

You can also use `:focus` and `:disabled`. Paste declarations directly; do not include a selector such as `.button { ... }`.

## Style index

| Style | Product pattern | Character |
| --- | --- | --- |
| 1. Fintech checkout | Payments and banking | Precise, trustworthy |
| 2. Productivity SaaS | Workspaces and collaboration | Calm, efficient |
| 3. Consumer marketplace | Shopping and delivery | Friendly, tactile |
| 4. Social pill | Social and messaging | Soft, approachable |
| 5. Developer console | Infrastructure and developer tools | Dark, technical |
| 6. Luxury editorial | Fashion, travel, and premium retail | Restrained, elegant |
| 7. Wellness | Health and habit products | Gentle, reassuring |
| 8. Gaming neon | Games and entertainment | Energetic, luminous |
| 9. Neo-brutalist | Creative tools and youth brands | Loud, graphic |
| 10. Glass interface | Media and immersive products | Translucent, dimensional |
| 11. Public service | Government and utilities | Clear, accessible |
| 12. Conversion gradient | Growth and commerce | Bold, action-oriented |

## 1. Fintech checkout

High-contrast controls with a restrained shadow and a strong keyboard focus treatment.

### Primary

```css
--button-bg: #635bff;
background: var(--button-bg);
color: #ffffff;
border: 1px solid rgba(0, 0, 0, .08);
border-radius: 8px;
box-shadow: 0 2px 5px rgba(50, 50, 93, .14), 0 1px 2px rgba(0, 0, 0, .08);
font-weight: 650;
letter-spacing: -.01em;
transition-property: transform, background-color, box-shadow;
transition-duration: 150ms;
transition-timing-function: ease-out;

:hover {
  background: #5147ff;
  box-shadow: 0 4px 10px rgba(50, 50, 93, .2), 0 2px 4px rgba(0, 0, 0, .1);
  transform: translateY(-1px);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(99, 91, 255, .35);
  outline-offset: 2px;
}
```

### Secondary

```css
background: #ffffff;
color: #37344f;
border: 1px solid #d9d7e5;
border-radius: 8px;
box-shadow: 0 1px 2px rgba(0, 0, 0, .04);
font-weight: 600;
transition-property: transform, background-color, border-color;
transition-duration: 150ms;

:hover {
  background: #f7f6ff;
  border-color: #b8b3ff;
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(99, 91, 255, .25);
  outline-offset: 2px;
}
```

## 2. Productivity SaaS

Neutral controls used in dense workspaces, editors, and collaboration products.

### Primary

```css
background: #2383e2;
color: #ffffff;
border: 1px solid #1d73c7;
border-radius: 6px;
box-shadow: 0 1px 2px rgba(15, 23, 42, .12);
font-weight: 600;
transition-property: background-color, box-shadow, transform;
transition-duration: 120ms;

:hover {
  background: #1b75cc;
  box-shadow: 0 2px 5px rgba(15, 23, 42, .16);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 2px solid #2383e2;
  outline-offset: 2px;
}
```

### Secondary

```css
background: #ffffff;
color: #37352f;
border: 1px solid rgba(55, 53, 47, .16);
border-radius: 6px;
box-shadow: 0 1px 2px rgba(15, 23, 42, .05);
font-weight: 550;
transition-property: background-color, border-color, transform;
transition-duration: 120ms;

:hover {
  background: rgba(55, 53, 47, .06);
  border-color: rgba(55, 53, 47, .24);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 2px solid #2383e2;
  outline-offset: 2px;
}
```

## 3. Consumer marketplace

Warm, rounded controls suited to commerce, local discovery, and delivery experiences.

### Primary

```css
background: #ff385c;
color: #ffffff;
border: 0;
border-radius: 12px;
box-shadow: 0 4px 12px rgba(255, 56, 92, .24);
font-weight: 700;
letter-spacing: .005em;
transition-property: transform, background-color, box-shadow;
transition-duration: 180ms;
transition-timing-function: cubic-bezier(.2, 0, 0, 1);

:hover {
  background: #e9294f;
  box-shadow: 0 7px 18px rgba(255, 56, 92, .3);
  transform: translateY(-1px);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(255, 56, 92, .3);
  outline-offset: 3px;
}
```

### Secondary

```css
background: #ffffff;
color: #222222;
border: 1px solid #b0b0b0;
border-radius: 12px;
box-shadow: 0 2px 6px rgba(0, 0, 0, .06);
font-weight: 650;
transition-property: transform, background-color, box-shadow;
transition-duration: 180ms;

:hover {
  background: #f7f7f7;
  box-shadow: 0 4px 10px rgba(0, 0, 0, .1);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(34, 34, 34, .22);
  outline-offset: 3px;
}
```

## 4. Social pill

Fully rounded buttons with a light, conversational feel.

### Primary

```css
background: #0a7cff;
color: #ffffff;
border: 0;
border-radius: 999px;
box-shadow: 0 3px 10px rgba(10, 124, 255, .24);
font-weight: 700;
padding-inline: 24px;
transition-property: transform, background-color, box-shadow;
transition-duration: 160ms;

:hover {
  background: #006ee6;
  box-shadow: 0 5px 14px rgba(10, 124, 255, .3);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(10, 124, 255, .3);
  outline-offset: 2px;
}
```

### Secondary

```css
background: #eaf3ff;
color: #0866c6;
border: 0;
border-radius: 999px;
font-weight: 700;
padding-inline: 22px;
transition-property: transform, background-color;
transition-duration: 160ms;

:hover {
  background: #d9eaff;
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(10, 124, 255, .25);
  outline-offset: 2px;
}
```

## 5. Developer console

Compact dark controls suited to dashboards, terminals, and infrastructure products.

### Primary

```css
--console-green: #3ddc97;
background: #111827;
color: var(--console-green);
border: 1px solid rgba(61, 220, 151, .42);
border-radius: 6px;
box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .03), 0 4px 14px rgba(0, 0, 0, .22);
font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
font-weight: 650;
letter-spacing: .02em;
transition-property: transform, background-color, border-color, box-shadow;
transition-duration: 140ms;

:hover {
  background: #172033;
  border-color: var(--console-green);
  box-shadow: 0 0 0 3px rgba(61, 220, 151, .1), 0 6px 18px rgba(0, 0, 0, .28);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 2px solid var(--console-green);
  outline-offset: 2px;
}
```

### Secondary

```css
background: #1f2937;
color: #d1d5db;
border: 1px solid #374151;
border-radius: 6px;
font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
font-weight: 600;
letter-spacing: .015em;
transition-property: transform, background-color, color, border-color;
transition-duration: 140ms;

:hover {
  background: #273449;
  color: #ffffff;
  border-color: #4b5563;
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 2px solid #3ddc97;
  outline-offset: 2px;
}
```

## 6. Luxury editorial

Quiet black-and-cream controls for premium fashion, hospitality, and travel.

### Primary

```css
background: #181714;
color: #f8f4eb;
border: 1px solid #181714;
border-radius: 0;
box-shadow: none;
font-family: Georgia, Times New Roman, serif;
font-weight: 500;
letter-spacing: .12em;
text-transform: uppercase;
transition-property: transform, background-color, color;
transition-duration: 220ms;

:hover {
  background: #403c34;
  color: #ffffff;
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 1px solid #181714;
  outline-offset: 4px;
}
```

### Secondary

```css
background: transparent;
color: #181714;
border: 1px solid #181714;
border-radius: 0;
box-shadow: none;
font-family: Georgia, Times New Roman, serif;
font-weight: 500;
letter-spacing: .1em;
text-transform: uppercase;
transition-property: transform, background-color, color;
transition-duration: 220ms;

:hover {
  background: #181714;
  color: #f8f4eb;
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 1px solid #181714;
  outline-offset: 4px;
}
```

## 7. Wellness

Low-stress colors, generous rounding, and soft elevation for health and habit products.

### Primary

```css
background: #356859;
color: #fffdf7;
border: 1px solid rgba(22, 72, 58, .2);
border-radius: 16px;
box-shadow: 0 5px 14px rgba(53, 104, 89, .2);
font-weight: 650;
letter-spacing: .005em;
transition-property: transform, background-color, box-shadow;
transition-duration: 200ms;
transition-timing-function: cubic-bezier(.2, 0, 0, 1);

:hover {
  background: #285548;
  box-shadow: 0 7px 18px rgba(53, 104, 89, .26);
  transform: translateY(-1px);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(53, 104, 89, .28);
  outline-offset: 3px;
}
```

### Secondary

```css
background: #e9f1ec;
color: #285548;
border: 1px solid #c7d9cf;
border-radius: 16px;
box-shadow: 0 2px 7px rgba(53, 104, 89, .08);
font-weight: 650;
transition-property: transform, background-color, border-color;
transition-duration: 200ms;

:hover {
  background: #dce9e1;
  border-color: #9fbead;
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(53, 104, 89, .24);
  outline-offset: 3px;
}
```

## 8. Gaming neon

Dark neon treatments for games, streaming, and entertainment products.

### Primary

```css
--neon: #b6ff3b;
background: #141414;
color: var(--neon);
border: 1px solid var(--neon);
border-radius: 8px;
box-shadow: 0 0 0 1px rgba(182, 255, 59, .16), 0 0 18px rgba(182, 255, 59, .22);
font-weight: 800;
letter-spacing: .055em;
text-transform: uppercase;
transition-property: transform, background-color, color, box-shadow;
transition-duration: 140ms;

:hover {
  background: var(--neon);
  color: #0b0b0b;
  box-shadow: 0 0 28px rgba(182, 255, 59, .48);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 2px solid var(--neon);
  outline-offset: 3px;
}
```

### Secondary

```css
background: #211c2d;
color: #d9c7ff;
border: 1px solid #7950c7;
border-radius: 8px;
box-shadow: 0 0 14px rgba(121, 80, 199, .16);
font-weight: 750;
letter-spacing: .035em;
text-transform: uppercase;
transition-property: transform, background-color, border-color, box-shadow;
transition-duration: 140ms;

:hover {
  background: #302442;
  border-color: #ad82ff;
  box-shadow: 0 0 22px rgba(173, 130, 255, .3);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 2px solid #ad82ff;
  outline-offset: 3px;
}
```

## 9. Neo-brutalist

Hard outlines and offset shadows for expressive creative products.

### Primary

```css
background: #ffdd33;
color: #111111;
border: 2px solid #111111;
border-radius: 3px;
box-shadow: 4px 4px 0 #111111;
font-weight: 800;
letter-spacing: .02em;
text-transform: uppercase;
transition-property: transform, box-shadow, background-color;
transition-duration: 100ms;

:hover {
  background: #ffe65f;
  box-shadow: 6px 6px 0 #111111;
  transform: translate(-2px, -2px);
}

:active {
  box-shadow: 1px 1px 0 #111111;
  transform: translate(3px, 3px);
}

:focus-visible {
  outline: 3px solid #5b4bff;
  outline-offset: 3px;
}
```

### Secondary

```css
background: #ffffff;
color: #111111;
border: 2px solid #111111;
border-radius: 3px;
box-shadow: 3px 3px 0 #111111;
font-weight: 800;
letter-spacing: .02em;
text-transform: uppercase;
transition-property: transform, box-shadow, background-color;
transition-duration: 100ms;

:hover {
  background: #ff8bd8;
  box-shadow: 5px 5px 0 #111111;
  transform: translate(-2px, -2px);
}

:active {
  box-shadow: 1px 1px 0 #111111;
  transform: translate(2px, 2px);
}

:focus-visible {
  outline: 3px solid #5b4bff;
  outline-offset: 3px;
}
```

## 10. Glass interface

Translucent controls for image-rich media, maps, and immersive interfaces.

### Primary

```css
background: rgba(17, 24, 39, .78);
color: #ffffff;
border: 1px solid rgba(255, 255, 255, .24);
border-radius: 14px;
box-shadow: 0 8px 24px rgba(15, 23, 42, .2), inset 0 1px 0 rgba(255, 255, 255, .16);
backdrop-filter: blur(14px) saturate(140%);
-webkit-backdrop-filter: blur(14px) saturate(140%);
font-weight: 650;
transition-property: transform, background-color, border-color, box-shadow;
transition-duration: 180ms;

:hover {
  background: rgba(17, 24, 39, .9);
  border-color: rgba(255, 255, 255, .4);
  box-shadow: 0 10px 28px rgba(15, 23, 42, .28), inset 0 1px 0 rgba(255, 255, 255, .2);
  transform: translateY(-1px);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(255, 255, 255, .5);
  outline-offset: 2px;
}
```

### Secondary

```css
background: rgba(255, 255, 255, .58);
color: #172033;
border: 1px solid rgba(255, 255, 255, .72);
border-radius: 14px;
box-shadow: 0 6px 18px rgba(15, 23, 42, .12), inset 0 1px 0 rgba(255, 255, 255, .65);
backdrop-filter: blur(12px) saturate(125%);
-webkit-backdrop-filter: blur(12px) saturate(125%);
font-weight: 650;
transition-property: transform, background-color, box-shadow;
transition-duration: 180ms;

:hover {
  background: rgba(255, 255, 255, .78);
  box-shadow: 0 8px 22px rgba(15, 23, 42, .16), inset 0 1px 0 rgba(255, 255, 255, .8);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(23, 32, 51, .3);
  outline-offset: 2px;
}
```

## 11. Public service

Clear, high-contrast controls with obvious focus states and minimal decoration.

### Primary

```css
background: #005ea8;
color: #ffffff;
border: 2px solid #005ea8;
border-radius: 4px;
box-shadow: 0 2px 0 #003e73;
font-weight: 700;
text-decoration: none;
transition-property: background-color, border-color, transform;
transition-duration: 100ms;

:hover {
  background: #003e73;
  border-color: #003e73;
}

:active {
  transform: translateY(2px);
}

:focus-visible {
  outline: 4px solid #ffbf47;
  outline-offset: 0;
}

:disabled {
  opacity: .5;
  cursor: not-allowed;
}
```

### Secondary

```css
background: #ffffff;
color: #005ea8;
border: 2px solid #005ea8;
border-radius: 4px;
box-shadow: 0 2px 0 #b1b4b6;
font-weight: 700;
transition-property: background-color, color, transform;
transition-duration: 100ms;

:hover {
  background: #e8f1f8;
  color: #003e73;
}

:active {
  transform: translateY(2px);
}

:focus-visible {
  outline: 4px solid #ffbf47;
  outline-offset: 0;
}

:disabled {
  opacity: .5;
  cursor: not-allowed;
}
```

## 12. Conversion gradient

High-energy controls for campaign pages, upgrades, and conversion-heavy commerce.

### Primary

```css
--gradient-start: #7c3aed;
--gradient-end: #ec4899;
background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
color: #ffffff;
border: 0;
border-radius: 12px;
box-shadow: 0 6px 18px rgba(124, 58, 237, .28);
font-weight: 750;
letter-spacing: .01em;
transition-property: transform, filter, box-shadow;
transition-duration: 180ms;
transition-timing-function: ease-out;

:hover {
  filter: saturate(1.12) brightness(1.04);
  box-shadow: 0 9px 24px rgba(124, 58, 237, .36);
  transform: translateY(-1px);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(124, 58, 237, .32);
  outline-offset: 3px;
}
```

### Secondary

```css
background: linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(135deg, #7c3aed, #ec4899) border-box;
color: #6d28d9;
border: 2px solid transparent;
border-radius: 12px;
box-shadow: 0 3px 10px rgba(124, 58, 237, .12);
font-weight: 700;
transition-property: transform, background-color, box-shadow;
transition-duration: 180ms;

:hover {
  background: #f7f1ff;
  box-shadow: 0 6px 16px rgba(124, 58, 237, .2);
}

:active {
  transform: scale(.96);
}

:focus-visible {
  outline: 3px solid rgba(124, 58, 237, .28);
  outline-offset: 3px;
}
```

## Demo checklist

1. Paste both blocks from one style into their matching editors.
2. Test the default and hover states in the preview.
3. Use the keyboard to confirm the focus ring is visible.
4. Switch between compact and roomy density.
5. Check both desktop and mobile preview widths.
6. Reset the studio before trying the next pair.

## Troubleshooting

- **A rule is ignored:** Make sure you pasted declarations rather than a full selector block.
- **A hover effect is ignored:** Use the supported `:hover { ... }` format shown above.
- **The button becomes hard to read:** Adjust `color` and `background` together and keep normal text contrast at 4.5:1 or higher.
- **The secondary outline looks doubled:** Set the Theme tab’s global Stroke value to `0`, or replace the snippet’s `border` with `box-shadow`.
- **A shadow clips:** Reduce the blur/spread or test the Roomy density.
- **You want the original style back:** Clear both CSS editors or use Reset.
