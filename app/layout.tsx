import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GetMait Dashboard',
  description: 'AI-Employee-as-a-Service for pizzerias',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body className={`${inter.className} bg-[#F8FAFC] text-[#1a1a2e] antialiased`}>
        {children}
      </body>
    </html>
  )
}
