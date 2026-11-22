import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CURSIS',
    short_name: 'CURSIS',
    description: 'Autonomous AI Workplace & Agency Operating System',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF6EE',
    theme_color: '#FAF6EE',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

