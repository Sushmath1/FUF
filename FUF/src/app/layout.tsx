import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'

import { AppProviders } from '@/components/AppProviders'

import './globals.css'

export const metadata: Metadata = {
  title: 'FindUrFest - Your fest, your schedule',
  description: 'Real-time venue updates and personal schedules for college fests',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#030712',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#f1f5f9',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              fontSize: '14px',
            },
            duration: 5000,
          }}
        />
      </body>
    </html>
  )
}
