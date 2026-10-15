# Cursis Neo-Brutalist Design System & Motion Graphics Guidelines (cursis.in)

You are designing, styling, and animating interfaces, marketing assets, and motion graphics for Cursis (cursis.in). Adhere to Cursis's signature White/Cream Neo-Brutalism:

## 1. Color Palette: Architectural White/Cream Canvas
* **Primary Canvas**: Clean architectural cream/white (`#FAF6EE` / `#FFFFFF` / `#EEF5E4`).
* **Solid Editorial Ink**: `#0A0A0A` / `#2B2F2A` for typography, borders, and hard shadow blocks.
* **Primary Brand Accent**: Electric Orange (`#FF5500` / `#FF4500`) — signature Cursis brand button and CTA.
* **Vibrant Neo Accents**:
  * Neo Mint: `#10B981` / `#008A15` (Success, active pipelines, telemetry).
  * Golden Marigold: `#FFCC00` / `#FFC233` (Warning tags, secondary badges).
  * Crimson Red: `#FF3815` / `#EF4444` (Blockers, traffic lights, errors).
  * Sky Blue: `#93C5FD` / `#60A5FA` (Auxiliary tabs).

## 2. Corner Geometry: Refined Rounded Neo-Brutalism
* Neo-Brutalism in Cursis combines bold editorial ink outlines with refined rounded corners (as seen on cursis.in and the motion graphics ads):
  * **Browser Windows & Stage Containers**: `border-radius: 28px` to `40px`.
  * **Standard UI Cards & Feature Panels**: `border-radius: 18px` to `28px`.
  * **Badges, Buttons & Call-to-Actions**: `border-radius: 9999px` (pills) or `12px` to `16px`.
  * **Traffic Dots & Team Avatars**: `border-radius: 50%` (circular dots).
  * **Checkbox & Small Toggles**: `border-radius: 8px` to `12px`.
* **Solid Offset Ink Shadows**: `4px 4px 0px #0A0A0A`, `6px 6px 0px #0A0A0A`, `8px 8px 0px #0A0A0A`, or `12px 12px 0px #0A0A0A`. Zero blurry drop shadows.
* **Heavy Solid Borders**: `3px` to `8px solid #0A0A0A` / `#2B2F2A`.

## 3. Motion Graphics Principles: Fluid & Continuous Motion
* **Smooth Harmonic & Spring Easings**:
  * Use fluid exponential curves (`cubic-bezier(0.16, 1, 0.3, 1)` / `smoothExpoOut`) and critically-damped spring physics with pleasant overshoot.
  * NO hard linear snaps, jarring beat-cuts, or abrupt innerHTML wipes without transition.
* **Continuous Scene Transitions**:
  * Scenes must seamlessly morph, cross-fade, slide, or scale through smooth interpolation windows (0.25s - 0.4s).
  * Outgoing scenes dolly back or slide with momentum while incoming scenes sweep in with matching velocity.
* **Kinetic Typography & Staggered Reveals**:
  * Text reveals use smooth vertical mask slides (`overflow: hidden` with `translateY`) or letter-spacing compression.
  * Multiple cards/modules enter with staggered delays (`stagger: 0.05s - 0.08s`) and secondary overshoot.
* **Continuous Camera Language**:
  * Keep the optical camera floating with subtle 3D translation (`translateZ`), gentle breathing rotation (`rotateX`, `rotateY`, `rotateZ`), and depth parallax.

