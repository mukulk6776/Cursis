---
name: cursis-design-system
description: >-
  Enforces Cursis's signature White/Cream Neo-Brutalism from cursis.in: warm architectural cream (#FAF6EE) canvas, Electric Orange (#FF5500) CTA branding, rounded card corners (14px-28px), solid offset ink shadows (6px-12px #0A0A0A), and fluid kinetic motion graphics. Trigger whenever designing, styling, building UI components, landing pages, or animated motion ads for Cursis.
license: Apache-2.0
metadata:
  version: v2
  target: cursis
---

# Cursis Neo-Brutalist Design System & Motion Graphics (cursis.in)

Complete architectural guide for implementing Cursis's signature White/Cream Neo-Brutalism and fluid motion graphics across all web applications, landing pages, marketing ads, and UI components.

---

## 1. Visual Aesthetics & Core Tokens

1. **Architectural White/Cream Canvas**:
   - Primary Background: Warm architectural linen / cream (`#FAF6EE` or `#F7F5EE`) or crisp white (`#FFFFFF`).
   - Editorial Ink Text & Outlines: Solid Charcoal Ink (`#0A0A0A` / `#1A1D1A`).

2. **Rounded Neo-Brutalist Geometry**:
   - Cursis combines high-contrast brutalist outlines with friendly, tactile rounded corners:
     - **Browser Windows & Stage Frames**: `border-radius: 24px - 36px`.
     - **Feature Cards & Modals**: `border-radius: 14px - 20px`.
     - **Buttons & Chips**: `border-radius: 10px - 14px`.
     - **Telemetry Pills & Traffic Dots**: `border-radius: 9999px` (pills) and `50%` (circular dots).
   - **Solid Ink Offset Shadows**: `4px 4px 0px #0A0A0A`, `6px 6px 0px #0A0A0A`, `8px 8px 0px #0A0A0A`, `12px 12px 0px #0A0A0A`. Zero blurry Gaussian glow.
   - **Solid High-Contrast Borders**: `3px` to `8px solid #0A0A0A`.

3. **Authentic Color Palette (Matching [cursis.in](https://cursis.in))**:

| Token Name | Hex Code | Role / Usage |
| :--- | :--- | :--- |
| **Cream Canvas** | `#FAF6EE` / `#F7F5EE` | Primary warm architectural background. |
| **Crisp Paper** | `#FFFFFF` | Elevated card surfaces, top faces. |
| **Solid Ink** | `#0A0A0A` / `#1A1D1A` | Outlines, borders, text, and hard shadow blocks. |
| **Electric Orange** | `#FF5500` / `#FF4500` | Primary brand CTA, energetic focus elements. |
| **Neo Mint** | `#10B981` / `#008A15` | Telemetry, active pipeline stages, success states. |
| **Golden Marigold**| `#FFCC00` / `#FFC233` | Warnings, secondary badges, tags. |
| **Crimson Red** | `#FF3815` / `#EF4444` | Blockers, traffic light dots, alerts. |
| **Soft Sky Blue** | `#93C5FD` / `#DBEAFE` | Auxiliary modules, tabs, secondary containers. |

---

## 2. Motion Graphics & Fluid Animation Rules

1. **Fluid Springs & Smooth Easings**:
   - Use continuous cubic-bezier curves (`cubic-bezier(0.16, 1, 0.3, 1)` or `easeOutExpo`) and critically-damped spring physics (`stiffness: 240`, `damping: 24`).
   - Avoid jarring instantaneous step-jumps. Every visual transition must flow smoothly from one state to the next with momentum.

2. **Continuous Camera Motion**:
   - Keep the optical camera active: continuous subtle 3D dollying (Z-depth translation), perspective tilts (`rotateX`, `rotateY`, `rotateZ`), and smooth lateral drift.

3. **Overlapping Action & Stagger**:
   - Elements animate in cascading sequences (`stagger: 0.05s - 0.08s`) rather than all snapping simultaneously.

4. **Liquid Shape Morphing**:
   - Morph shapes through interpolated bezier vertices with smooth curvature rather than rigid polygonal snaps.

---

## 3. Ready-to-Use CSS Component Snippets

```css
/* Signature Cursis Cream Window */
.cursis-window {
  background-color: #FFFFFF;
  border: 4px solid #0A0A0A;
  border-radius: 24px;
  box-shadow: 8px 8px 0px #0A0A0A;
  overflow: hidden;
}

/* Primary Electric Orange Button */
.btn-cursis {
  background-color: #FF5500;
  color: #FFFFFF;
  border: 3px solid #0A0A0A;
  border-radius: 12px;
  box-shadow: 4px 4px 0px #0A0A0A;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  padding: 12px 24px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-cursis:hover {
  background-color: #FF722B;
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #0A0A0A;
}
.btn-cursis:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #0A0A0A;
}

/* Telemetry Pill */
.cursis-pill {
  background-color: #10B981;
  color: #0A0A0A;
  border: 2px solid #0A0A0A;
  border-radius: 9999px;
  box-shadow: 3px 3px 0px #0A0A0A;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```
