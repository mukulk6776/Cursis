'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
const Demo = dynamic(() => import('./OrdisSection'), { ssr: false, loading: () => <p role="status">Loading Ordis…</p> });
export default function LazyOrdisDemo() {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setReady(true); observer.disconnect(); }
    }, { rootMargin: '300px' });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} className="lp-demo-reserved">{ready ? <Demo /> : <div className="lp-demo-placeholder"><button type="button" className="btn btn-secondary" onClick={() => setReady(true)}>Load the interactive demo</button><noscript><a href="/signup">Create a workspace</a></noscript></div>}</div>;
}
