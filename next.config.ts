import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  compress: true,
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ybjrmvvkasohslgsrhzh.supabase.co' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://ybjrmvvkasohslgsrhzh.supabase.co",
              "connect-src 'self' https://ybjrmvvkasohslgsrhzh.supabase.co wss://ybjrmvvkasohslgsrhzh.supabase.co https://api.resend.com https://*.sentry.io",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: 'ueemt-tokat',
  project: 'ueemt-tokat',
  silent: true,
  widenClientFileUpload: true,
})
