import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import PushNotificationManager from '@/components/PushNotificationManager'

export const metadata: Metadata = {
  title: 'Bucks Flow Premium',
  description: 'Controle financeiro inteligente',
  manifest: '/finance_control/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bucks Flow',
  },
}

export const viewport: Viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-[#050505] text-white">
        <AuthProvider>
          <PushNotificationManager />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
