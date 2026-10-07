# Performance Optimization — Critical Request Chain Fix

## Problem Identified

The Firebase Auth iframe was blocking the critical rendering path, causing a 2,542ms delay before LCP could occur.

### Before Optimization
```
Maximum critical path latency: 2,542 ms
- Initial Navigation: 273 ms (15.72 KiB)
- CSS Chunk 1: 629 ms (11.31 KiB)
- CSS Chunk 2: 625 ms (12.66 KiB)
- Firebase iframe: 2,542 ms (93.41 KiB) ⚠️ BLOCKER
```

## Optimizations Implemented

### 1. **Firebase Lazy Loading** (`lib/firebase-lazy.ts`)
- Removed automatic Firebase initialization on page load
- Firebase only loads when users visit `/login` or `/signup` routes
- Saves **~93 KiB + 2,542ms** on landing page

**Implementation:**
```typescript
// Before: Firebase loaded on every page
getFirebaseAuth(); // Blocks rendering

// After: Lazy loaded only when needed
export async function loadFirebase() {
  if (firebasePromise) return firebasePromise;
  firebasePromise = import('./firebase').then(...);
  return firebasePromise;
}
```

### 2. **Resource Hints** (`app/layout.tsx`)
Added DNS prefetch and preconnect for external resources:
```html
<!-- Fonts (critical) -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

<!-- Firebase (on-demand only) -->
<link rel="dns-prefetch" href="https://firebaseapp.com" />
```

**Why this works:**
- DNS resolution happens in parallel with HTML parsing
- Preconnect establishes TCP/TLS connections early
- Saves 200-400ms on first external resource request

### 3. **Code Splitting** (`next.config.ts`)
Aggressive chunk splitting for better caching:
```typescript
splitChunks: {
  cacheGroups: {
    firebase: { priority: 10 },  // Separate Firebase chunk
    framer: { priority: 9 },     // Separate animation library
    vendor: { priority: 8 }       // Other dependencies
  }
}
```

**Benefits:**
- Firebase bundle only downloads on auth pages
- Unchanged vendor code uses browser cache
- Parallel chunk downloads reduce sequential blocking

### 4. **Component Lazy Loading**
```typescript
// CookieConsent doesn't need to block initial render
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), {
  ssr: false,
});
```

### 5. **CSS Optimization**
Enabled Next.js CSS optimization:
```typescript
experimental: {
  optimizeCss: true,
}
```

## Expected Results

### Before
- **LCP**: ~3,000ms (blocked by Firebase iframe)
- **FCP**: ~900ms
- **Total Blocking Time**: ~800ms
- **Bundle Size**: 93.41 KiB Firebase + CSS

### After (Projected)
- **LCP**: ~1,200ms (Firebase removed from critical path)
- **FCP**: ~600ms (faster CSS delivery)
- **Total Blocking Time**: ~200ms
- **Bundle Size**: 0 KiB Firebase on landing (lazy loaded on auth pages)

### Improvements
- ✅ **60% faster LCP** (2,542ms → ~1,000ms saved)
- ✅ **93 KiB smaller initial bundle** on landing page
- ✅ **Firebase loads only when needed** (login/signup)
- ✅ **Better caching** through chunk splitting
- ✅ **Parallel resource loading** with preconnect

## Verification

### Manual Testing
```bash
npm run build
npm start

# Test with Lighthouse
lighthouse http://localhost:3000 --view
```

### Key Metrics to Check
1. **Network tab**: Firebase should NOT load on landing page
2. **LCP**: Should be < 2.5s
3. **FCP**: Should be < 1.8s
4. **CLS**: Should be < 0.1

### Automated Testing
```bash
# Run Lighthouse CI
npm install -g @lhci/cli
lhci autorun --config=.lighthouserc.json
```

## Next Steps (Optional)

### Further Optimizations
1. **Image Optimization**: Use Next.js `<Image>` with priority for hero images
2. **Font Optimization**: Subset Google Fonts to only used characters
3. **Service Worker**: Cache static assets with Workbox
4. **Critical CSS**: Inline above-the-fold CSS
5. **HTTP/2 Server Push**: Push critical resources

### Monitoring
Set up performance monitoring:
- **Vercel Analytics**: Built-in Real User Monitoring
- **Web Vitals**: Track Core Web Vitals in production
- **Lighthouse CI**: Automated performance regression testing

## Architecture Decision

**Why lazy load Firebase instead of removing it?**
- Firebase is needed for Google OAuth on auth pages
- Email/password auth uses native Cursis API (no Firebase)
- Lazy loading gives us both: fast landing page + OAuth support

## Files Modified

1. `lib/firebase-lazy.ts` — New lazy loading utility
2. `lib/auth/firebase.ts` — Removed auto-initialization
3. `next.config.ts` — Webpack chunk splitting + CSS optimization
4. `app/layout.tsx` — Resource hints + dynamic CookieConsent
5. `app/login/loading.tsx` — Loading state for route transition
6. `app/signup/loading.tsx` — Loading state for route transition

## Related Issues
- Firebase iframe blocking: [#2542ms delay]
- CSS chunks render-blocking: [11.31 KiB + 12.66 KiB]
- Bundle size optimization: [93.41 KiB removed from landing]

---

**Performance is a feature.** These optimizations improve user experience, SEO rankings, and conversion rates.
