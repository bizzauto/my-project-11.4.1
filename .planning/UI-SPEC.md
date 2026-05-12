# UI-SPEC.md - UI Design Contract

**Phase**: Project Fixes & Futuristic UI Update
**Date**: May 6, 2026
**Status**: ✅ Implemented

---

## Design System

### Color Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-primary` | #6366f1 | - | Main brand color (Indigo) |
| `--color-secondary` | #8b5cf6 | - | Secondary (Purple) |
| `--color-accent` | #ec4899 | - | Accent (Pink) |
| `--color-success` | #22c55e | - | Green |
| `--color-error` | #ef4444 | - | Red |
| `--color-bg-primary` | #ffffff | #0f172a | Background |
| `--color-bg-secondary` | #f8fafc | #1e293b | Cards/Surfaces |

### Typography

- **Headings**: Inter/System font
- **Body**: TailwindCSS defaults
- **Mono**: Font-mono for codes

### Spacing System

- Base unit: 4px
- Scale: sm(8px), md(16px), lg(24px), xl(32px), 2xl(48px)

### Animation Timings

- `--transition-fast`: 150ms
- `--transition-normal`: 300ms  
- `--transition-slow`: 500ms

---

## Components

### Buttons

```css
.btn-futuristic {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
  border: 1px solid rgba(139, 92, 246, 0.5);
  transition: all 0.3s ease;
}
.btn-futuristic:hover {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
  transform: scale(1.02);
}
```

### Cards

```css
.card-futuristic {
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-futuristic:hover {
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 0 30px rgba(139, 92, 246, 0.15);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input-futuristic:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
}
```

---

## Animations

### Glow Effects
- `.glow-effect` - Pulsing glow animation (2s)
- `.glow-text` - Text glow animation

### Gradient Animations
- `.gradient-text` - Animated gradient text (5s)
- `.gradient-animate` - Background gradient shift (15s)

### Special Effects
- `.glass-effect` - Glassmorphism (backdrop-filter: blur)
- `.glass-dark` - Dark glassmorphism
- `.neon-text` - Neon text shadow
- `.neon-border` - Neon border glow

### Motion
- `.animate-float` - Floating animation (3s)
- `.shimmer` - Shimmer loading effect
- `.hover-lift` - Hover lift transform

---

## Accessibility

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.3);
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast
```css
@media (prefers-contrast: high) {
  /* Enhanced contrast mode */
}
```

---

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

Mobile features:
- Touch targets: 44px minimum
- Safe area insets
- Smooth touch scrolling

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| CSS Variables | ✅ | 50+ custom properties |
| Button Styles | ✅ | `.btn-futuristic` |
| Card Styles | ✅ | `.card-futuristic` |
| Input Styles | ✅ | `.input-futuristic` |
| Glow Effects | ✅ | `.glow-effect`, `.neon-text` |
| Gradient Text | ✅ | `.gradient-text` |
| Glassmorphism | ✅ | `.glass-effect`, `.glass-dark` |
| Focus States | ✅ | `:focus-visible` |
| Animations | ✅ | Float, shimmer, lift |
| Mobile Support | ✅ | Safe areas, touch targets |

---

**Verified**: May 6, 2026
**Contract**: Valid