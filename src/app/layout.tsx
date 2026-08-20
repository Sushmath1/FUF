import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'

import { AppProviders } from '@/components/AppProviders'
import { CustomCursor } from '@/components/CustomCursor'

import './globals.css'

export const metadata: Metadata = {
  title: 'FindUrFest — Your fest, your schedule',
  description: 'Real-time venue updates and personal schedules for college fests',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#150810',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CustomCursor />
        <AppProviders>{children}</AppProviders>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(13, 13, 26, 0.9)',
              color: '#f0eeff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              fontSize: '14px',
              backdropFilter: 'blur(16px)',
            },
            duration: 5000,
          }}
        />
      </body>
    </html>
  )
}
