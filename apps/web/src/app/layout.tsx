import type { Metadata } from 'next'
import { Providers } from './providers'
import './styles/globals.css'

export const metadata: Metadata = {
  title: 'PlayHost - Minecraft Hosting',
  description: 'Professional Minecraft Server Hosting Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
